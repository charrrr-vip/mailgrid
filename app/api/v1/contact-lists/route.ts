import { z } from "zod";
import { ok, fail } from "@/lib/api/response";
import { requireUser } from "@/lib/api/auth";

const createListSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional().or(z.literal("")),
});

export async function GET() {
  const { supabase, user, errorResponse } = await requireUser();
  if (!user) return errorResponse;

  const { data, error } = await supabase
    .from("contact_lists")
    .select("id,name,description,contact_count,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return fail("LIST_FETCH_FAILED", error.message, 500);
  return ok(data ?? []);
}

export async function POST(request: Request) {
  const { supabase, user, errorResponse } = await requireUser();
  if (!user) return errorResponse;

  const body = await request.json().catch(() => null);
  const parsed = createListSchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_PAYLOAD", "Invalid list name", 422);
  }

  const { data, error } = await supabase
    .from("contact_lists")
    .insert({
      user_id: user.id,
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
    })
    .select("id,name,description,contact_count,created_at")
    .single();

  if (error) return fail("LIST_CREATE_FAILED", error.message, 500);
  return ok(data);
}
