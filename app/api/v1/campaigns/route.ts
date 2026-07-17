import { z } from "zod";
import { ok, fail } from "@/lib/api/response";
import { requireUser } from "@/lib/api/auth";

const createCampaignSchema = z.object({
  name: z.string().min(2).max(180),
  template_id: z.string().uuid(),
  list_id: z.string().uuid(),
  from_name: z.string().min(2).max(140),
  from_email: z.string().email(),
  reply_to: z.string().email().optional().or(z.literal("")),
});

export async function GET() {
  const { supabase, user, errorResponse } = await requireUser();
  if (!user) return errorResponse;

  const { data, error } = await supabase
    .from("campaigns")
    .select("id,name,status,template_id,list_id,scheduled_at,created_at,stats")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return fail("CAMPAIGN_FETCH_FAILED", error.message, 500);
  return ok(data ?? []);
}

export async function POST(request: Request) {
  const { supabase, user, errorResponse } = await requireUser();
  if (!user) return errorResponse;

  const body = await request.json().catch(() => null);
  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) return fail("INVALID_PAYLOAD", "Invalid campaign payload", 422);

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      user_id: user.id,
      name: parsed.data.name.trim(),
      template_id: parsed.data.template_id,
      list_id: parsed.data.list_id,
      from_name: parsed.data.from_name.trim(),
      from_email: parsed.data.from_email.trim().toLowerCase(),
      reply_to: parsed.data.reply_to?.trim() || null,
      status: "draft",
    })
    .select("id,name,status,template_id,list_id,scheduled_at,created_at,stats")
    .single();

  if (error) return fail("CAMPAIGN_CREATE_FAILED", error.message, 500);
  return ok(data);
}
