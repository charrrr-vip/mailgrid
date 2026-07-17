import { z } from "zod";
import { ok, fail } from "@/lib/api/response";
import { requireUser } from "@/lib/api/auth";

const updateTemplateSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  subject: z.string().max(255).optional().or(z.literal("")),
  html_content: z.string().optional().or(z.literal("")),
  design_json: z.unknown().nullable().optional(),
  preview_text: z.string().max(255).optional().or(z.literal("")),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, errorResponse } = await requireUser();
  if (!user) return errorResponse;
  const { id } = await params;

  const { data, error } = await supabase
    .from("templates")
    .select("id,name,subject,html_content,design_json,preview_text,updated_at,created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) return fail("TEMPLATE_NOT_FOUND", "Template not found", 404);
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
  const parsed = updateTemplateSchema.safeParse(body);
  if (!parsed.success) return fail("INVALID_PAYLOAD", "Invalid template payload", 422);

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name.trim();
  if (parsed.data.subject !== undefined) updates.subject = parsed.data.subject?.trim() ?? "";
  if (parsed.data.html_content !== undefined) updates.html_content = parsed.data.html_content ?? "";
  if (parsed.data.design_json !== undefined) updates.design_json = parsed.data.design_json;
  if (parsed.data.preview_text !== undefined) updates.preview_text = parsed.data.preview_text?.trim() || null;

  const { data, error } = await supabase
    .from("templates")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id,name,subject,html_content,design_json,preview_text,updated_at,created_at")
    .single();

  if (error) return fail("TEMPLATE_UPDATE_FAILED", error.message, 500);
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
    .from("templates")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return fail("TEMPLATE_DELETE_FAILED", error.message, 500);
  return ok({ deleted: true });
}
