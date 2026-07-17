import { z } from "zod";
import { ok, fail } from "@/lib/api/response";
import { requireUser } from "@/lib/api/auth";

const updateListSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional().or(z.literal("")),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, errorResponse } = await requireUser();
  if (!user) return errorResponse;
  const { id } = await params;

  const { data, error } = await supabase
    .from("contact_lists")
    .select("id,name,description,contact_count,created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) return fail("LIST_NOT_FOUND", "List not found", 404);
  return ok(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, errorResponse } = await requireUser();
  if (!user) return errorResponse;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = updateListSchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_PAYLOAD", "Invalid payload", 422);
  }

  const updates: { name?: string; description?: string | null } = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name.trim();
  if (parsed.data.description !== undefined) {
    updates.description = parsed.data.description?.trim() || null;
  }

  const { data, error } = await supabase
    .from("contact_lists")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id,name,description,contact_count,created_at")
    .single();

  if (error) return fail("LIST_UPDATE_FAILED", error.message, 500);
  return ok(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, errorResponse } = await requireUser();
  if (!user) return errorResponse;
  const { id } = await params;

  const { error } = await supabase
    .from("contact_lists")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return fail("LIST_DELETE_FAILED", error.message, 500);
  return ok({ deleted: true });
}
