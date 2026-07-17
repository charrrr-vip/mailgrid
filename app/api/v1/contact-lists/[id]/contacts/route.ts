import { z } from "zod";
import { ok, fail } from "@/lib/api/response";
import { requireUser } from "@/lib/api/auth";

const createContactSchema = z.object({
  email: z.string().email(),
  first_name: z.string().max(120).optional().or(z.literal("")),
  last_name: z.string().max(120).optional().or(z.literal("")),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, errorResponse } = await requireUser();
  if (!user) return errorResponse;
  const { id } = await params;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "25")));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: list } = await supabase
    .from("contact_lists")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!list) return fail("LIST_NOT_FOUND", "List not found", 404);

  let query = supabase
    .from("contacts")
    .select(
      "id,email,first_name,last_name,status,created_at,unsubscribe_token",
      { count: "exact" }
    )
    .eq("list_id", id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status && status !== "all") query = query.eq("status", status);
  if (search) query = query.ilike("email", `%${search}%`);

  const { data, count, error } = await query;
  if (error) return fail("CONTACT_FETCH_FAILED", error.message, 500);

  return ok(data ?? [], {
    page,
    limit,
    total: count ?? 0,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, errorResponse } = await requireUser();
  if (!user) return errorResponse;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = createContactSchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_PAYLOAD", "Invalid contact", 422);
  }

  const email = parsed.data.email.trim().toLowerCase();

  const { data: list } = await supabase
    .from("contact_lists")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!list) return fail("LIST_NOT_FOUND", "List not found", 404);

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      list_id: id,
      email,
      first_name: parsed.data.first_name?.trim() || null,
      last_name: parsed.data.last_name?.trim() || null,
      custom_fields: {},
    })
    .select("id,email,first_name,last_name,status,created_at")
    .single();

  if (error) return fail("CONTACT_CREATE_FAILED", error.message, 500);
  return ok(data);
}
