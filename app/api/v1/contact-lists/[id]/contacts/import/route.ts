import { ok, fail } from "@/lib/api/response";
import { requireUser } from "@/lib/api/auth";

export const maxDuration = 300;

type CsvRowError = {
  row: number;
  email: string;
  reason: string;
};

function parseCsvLine(line: string) {
  return line.split(",").map((cell) => cell.trim());
}

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

const EMAIL_HEADERS = new Set([
  "email",
  "e-mail",
  "e_mail",
  "mail",
  "email_address",
  "emailaddress",
]);

const FIRST_NAME_HEADERS = new Set([
  "first_name",
  "firstname",
  "first",
  "prenom",
  "prénom",
  "given_name",
  "givenname",
]);

const LAST_NAME_HEADERS = new Set([
  "last_name",
  "lastname",
  "last",
  "nom",
  "surname",
  "family_name",
  "familyname",
]);

function findColumnIndex(headers: string[], aliases: Set<string>) {
  return headers.findIndex((header) => aliases.has(normalizeHeader(header)));
}

function parseCsv(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { headers: [] as string[], rows: [] as string[][], rowOffset: 1 };
  }

  const firstRow = parseCsvLine(lines[0]);
  const firstCell = (firstRow[0] ?? "").toLowerCase();

  // Headerless CSV: email,first_name,last_name on every line
  if (firstCell && isValidEmail(firstCell)) {
    return {
      headers: ["email", "first_name", "last_name"],
      rows: lines.map(parseCsvLine),
      rowOffset: 1,
    };
  }

  const headers = firstRow.map(normalizeHeader);
  const rows = lines.slice(1).map(parseCsvLine);
  return { headers, rows, rowOffset: 2 };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isTextEmailListFile(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".txt") || file.type === "text/plain";
}

function parseEmailListText(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { headers: [] as string[], rows: [] as string[][], rowOffset: 1 };
  }

  const firstLine = lines[0];
  const hasHeader =
    EMAIL_HEADERS.has(normalizeHeader(firstLine)) && !isValidEmail(firstLine.toLowerCase());
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return {
    headers: ["email", "first_name", "last_name"],
    rows: dataLines.map((email) => [email]),
    rowOffset: hasHeader ? 2 : 1,
  };
}

function parseImportFile(content: string, file: File) {
  if (isTextEmailListFile(file)) {
    return parseEmailListText(content);
  }
  return parseCsv(content);
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
    return fail("INVALID_FILE", "Import file is missing", 422);
  }

  const allowedExtensions = [".csv", ".txt"];
  const lowerName = file.name.toLowerCase();
  if (!allowedExtensions.some((ext) => lowerName.endsWith(ext))) {
    return fail("INVALID_FILE", "Only CSV or TXT files are supported", 422);
  }

  const content = await file.text();
  const { headers, rows, rowOffset } = parseImportFile(content, file);

  const emailIndex = findColumnIndex(headers, EMAIL_HEADERS);
  const firstNameIndex = findColumnIndex(headers, FIRST_NAME_HEADERS);
  const lastNameIndex = findColumnIndex(headers, LAST_NAME_HEADERS);

  if (emailIndex < 0) {
    return fail("INVALID_FILE", "Required email column is missing", 422);
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
    const rowNumber = idx + rowOffset;
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

  const deduped = Array.from(
    records
      .reduce((map, record) => {
        if (!map.has(record.email)) map.set(record.email, record);
        return map;
      }, new Map<string, (typeof records)[number]>())
      .values()
  );

  if (deduped.length === 0) {
    return ok({
      imported: 0,
      skipped: errors.length,
      errors,
    });
  }

  const BATCH_SIZE = 1000;
  let imported = 0;
  let skipped = 0;

  for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
    const batch = deduped.slice(i, i + BATCH_SIZE).map((record) => ({
      email: record.email,
      first_name: record.first_name,
      last_name: record.last_name,
      custom_fields: record.custom_fields,
    }));

    const { data, error } = await supabase.rpc("import_contacts_bulk", {
      p_list_id: id,
      p_contacts: batch,
    });

    if (error) {
      if (error.message.includes("import_contacts_bulk")) {
        return fail(
          "IMPORT_NOT_CONFIGURED",
          "Bulk import is not configured yet. Apply database migration 004_bulk_contact_import.sql in Supabase.",
          500
        );
      }
      return fail("IMPORT_FAILED", error.message, 500);
    }

    const result = Array.isArray(data) ? data[0] : data;
    imported += result?.imported_count ?? 0;
    skipped += result?.skipped_count ?? 0;
  }

  skipped += errors.length;

  return ok({
    imported,
    skipped,
    errors: errors.slice(0, 100),
  });
}
