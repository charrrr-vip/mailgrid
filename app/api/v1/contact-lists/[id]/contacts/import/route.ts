import { ok, fail } from "@/lib/api/response";
import { requireUser } from "@/lib/api/auth";

type CsvRowError = {
  row: number;
  email: string;
  reason: string;
};

function parseCsv(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { headers: [], rows: [] as string[][] };
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1).map((line) => line.split(",").map((c) => c.trim()));
  return { headers, rows };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, errorResponse } = await requireUser();
  if (!user) return errorResponse;
  const { id } = await params;

  const { data: list } = await supabase
    .from("contact_lists")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!list) return fail("LIST_NOT_FOUND", "List not found", 404);

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return fail("INVALID_FILE", "CSV file is missing", 422);
  }

  const content = await file.text();
  const { headers, rows } = parseCsv(content);

  const emailIndex = headers.indexOf("email");
  const firstNameIndex = headers.indexOf("first_name");
  const lastNameIndex = headers.indexOf("last_name");

  if (emailIndex < 0) {
    return fail("INVALID_CSV", "Required email column is missing", 422);
  }

  const errors: CsvRowError[] = [];
  const records: Array<{
    list_id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    custom_fields: Record<string, string>;
  }> = [];

  rows.forEach((cells, idx) => {
    const rowNumber = idx + 2;
    const email = (cells[emailIndex] ?? "").trim().toLowerCase();
    if (!email || !isValidEmail(email)) {
      errors.push({ row: rowNumber, email, reason: "invalid_email" });
      return;
    }

    const custom_fields: Record<string, string> = {};
    headers.forEach((header, hIndex) => {
      if (!["email", "first_name", "last_name"].includes(header)) {
        const value = (cells[hIndex] ?? "").trim();
        if (value) custom_fields[header] = value;
      }
    });

    records.push({
      list_id: id,
      email,
      first_name: firstNameIndex >= 0 ? (cells[firstNameIndex] ?? "").trim() || null : null,
      last_name: lastNameIndex >= 0 ? (cells[lastNameIndex] ?? "").trim() || null : null,
      custom_fields,
    });
  });

  if (records.length === 0) {
    return ok({
      imported: 0,
      skipped: errors.length,
      errors,
    });
  }

  const { data: inserted, error } = await supabase
    .from("contacts")
    .upsert(records, {
      onConflict: "list_id,email",
      ignoreDuplicates: true,
    })
    .select("id");

  if (error) return fail("IMPORT_FAILED", error.message, 500);

  const imported = inserted?.length ?? 0;
  const skipped = rows.length - imported;

  return ok({
    imported,
    skipped,
    errors,
  });
}
