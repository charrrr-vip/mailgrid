import { z } from "zod";
import { ok, fail } from "@/lib/api/response";
import { requireUser } from "@/lib/api/auth";

const updateContactSchema = z.object({
  first_name: z.string().max(120).optional().or(z.literal("")),
  last_name: z.string().max(120).optional().or(z.literal("")),
  status: z.enum(["active", "unsubscribed", "bounced", "complained"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, errorResponse } = await requireUser();
  if (!user) return errorResponse;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = updateContactSchema.safeParse(body);
  if (!parsed.success) return fail("INVALID_PAYLOAD", "Invalid payload", 422);

  const updates: { first_name?: string | null; last_name?: string | null; status?: string } = {};
  if (parsed.data.first_name !== undefined) updates.first_name = parsed.data.first_name || null;
  if (parsed.data.last_name !== undefined) updates.last_name = parsed.data.last_name || null;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;

  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", id)
    .select("id,email,first_name,last_name,status,created_at")
    .single();

  if (error) return fail("CONTACT_UPDATE_FAILED", error.message, 500);
  return ok(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, errorResponse } = await requireUser();
  if (!user) return errorResponse;
  const { id } = await params;

  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) return fail("CONTACT_DELETE_FAILED", error.message, 500);

  return ok({ deleted: true });
}
