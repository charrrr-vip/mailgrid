import { z } from "zod";
import { ok, fail } from "@/lib/api/response";
import { requireUser } from "@/lib/api/auth";

const updateCampaignSchema = z.object({
  name: z.string().min(2).max(180).optional(),
  template_id: z.string().uuid().optional(),
  list_id: z.string().uuid().optional(),
  from_name: z.string().min(2).max(140).optional(),
  from_email: z.string().email().optional(),
  reply_to: z.string().email().optional().or(z.literal("")),
  scheduled_at: z.string().datetime().optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, errorResponse } = await requireUser();
  if (!user) return errorResponse;
  const { id } = await params;

  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) return fail("CAMPAIGN_NOT_FOUND", "Campaign not found", 404);
  return ok(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, errorResponse } = await requireUser();
  if (!user) return errorResponse;
  const { id } = await params;

  const { data: current, error: currentError } = await supabase
    .from("campaigns")
    .select("status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (currentError) return fail("CAMPAIGN_NOT_FOUND", "Campaign not found", 404);
  if (current.status !== "draft" && current.status !== "scheduled") {
    return fail("CAMPAIGN_LOCKED", "Only draft/scheduled campaigns can be edited", 409);
  }

  const body = await request.json().catch(() => null);
  const parsed = updateCampaignSchema.safeParse(body);
  if (!parsed.success) return fail("INVALID_PAYLOAD", "Invalid campaign payload", 422);

  const updates: Record<string, string | null> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name.trim();
  if (parsed.data.template_id !== undefined) updates.template_id = parsed.data.template_id;
  if (parsed.data.list_id !== undefined) updates.list_id = parsed.data.list_id;
  if (parsed.data.from_name !== undefined) updates.from_name = parsed.data.from_name.trim();
  if (parsed.data.from_email !== undefined) updates.from_email = parsed.data.from_email.trim().toLowerCase();
  if (parsed.data.reply_to !== undefined) updates.reply_to = parsed.data.reply_to?.trim() || null;
  if (parsed.data.scheduled_at !== undefined) updates.scheduled_at = parsed.data.scheduled_at;

  const { data, error } = await supabase
    .from("campaigns")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return fail("CAMPAIGN_UPDATE_FAILED", error.message, 500);
  return ok(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, errorResponse } = await requireUser();
  if (!user) return errorResponse;
  const { id } = await params;

  const { data: campaign, error: fetchError } = await supabase
    .from("campaigns")
    .select("status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError) return fail("CAMPAIGN_NOT_FOUND", "Campaign not found", 404);
  if (campaign.status !== "draft") {
    return fail("CAMPAIGN_DELETE_FORBIDDEN", "Only draft campaigns can be deleted", 409);
  }

  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return fail("CAMPAIGN_DELETE_FAILED", error.message, 500);
  return ok({ deleted: true });
}
