import PgBoss from "pg-boss";
import { ok, fail } from "@/lib/api/response";
import { requireUser } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type CampaignRow = {
  id: string;
  user_id: string;
  status: "draft" | "scheduled" | "sending" | "paused" | "completed" | "cancelled";
  list_id: string | null;
  template_id: string | null;
};

function buildIdempotencyKey(campaignId: string, contactId: string) {
  return `${campaignId}:${contactId}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, errorResponse } = await requireUser();
  if (!user) return errorResponse;
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const scheduledAt = typeof body?.scheduled_at === "string" ? body.scheduled_at : null;

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id,user_id,status,list_id,template_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single<CampaignRow>();

  if (campaignError || !campaign) {
    return fail("CAMPAIGN_NOT_FOUND", "Campaign not found", 404);
  }

  if (campaign.status !== "draft" && campaign.status !== "scheduled") {
    return fail("CAMPAIGN_NOT_SCHEDULABLE", "Campaign cannot be scheduled in current status", 409);
  }

  if (!campaign.list_id || !campaign.template_id) {
    return fail("CAMPAIGN_INVALID", "Campaign must have a list and template", 422);
  }

  const admin = createAdminClient();
  const { data: contacts, error: contactsError } = await admin
    .from("contacts")
    .select("id,email,status")
    .eq("list_id", campaign.list_id)
    .eq("status", "active");

  if (contactsError) return fail("CONTACTS_FETCH_FAILED", contactsError.message, 500);
  if (!contacts || contacts.length === 0) {
    return fail("EMPTY_AUDIENCE", "No active contacts in this list", 422);
  }

  const emailSendsPayload = contacts.map((contact) => ({
    campaign_id: campaign.id,
    contact_id: contact.id,
    status: "pending",
    idempotency_key: buildIdempotencyKey(campaign.id, contact.id),
  }));

  const { data: inserted, error: insertError } = await admin
    .from("email_sends")
    .upsert(emailSendsPayload, { onConflict: "campaign_id,contact_id", ignoreDuplicates: true })
    .select("id,campaign_id,contact_id");

  if (insertError) return fail("EMAIL_SENDS_CREATE_FAILED", insertError.message, 500);

  const total = inserted?.length ?? 0;
  if (total === 0) {
    return fail("NOTHING_TO_SEND", "No new recipients to enqueue", 422);
  }

  const nextStatus = scheduledAt ? "scheduled" : "sending";
  const { error: updateCampaignError } = await admin
    .from("campaigns")
    .update({
      status: nextStatus,
      scheduled_at: scheduledAt,
      started_at: scheduledAt ? null : new Date().toISOString(),
      stats: {
        total,
        pending: total,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        complained: 0,
        failed: 0,
      },
    })
    .eq("id", campaign.id);

  if (updateCampaignError) return fail("CAMPAIGN_UPDATE_FAILED", updateCampaignError.message, 500);

  if (scheduledAt) {
    return ok({
      status: "scheduled",
      total_recipients: total,
      scheduled_at: scheduledAt,
      enqueued: 0,
    });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return fail("DATABASE_URL_MISSING", "DATABASE_URL is required to enqueue jobs", 500);
  }

  const boss = new PgBoss(databaseUrl);
  try {
    await boss.start();
    await Promise.all(
      inserted.map((item) =>
        boss.send("send-email", {
          emailSendId: item.id,
          campaignId: item.campaign_id,
          contactId: item.contact_id,
        })
      )
    );
  } catch (error) {
    return fail(
      "QUEUE_ENQUEUE_FAILED",
      error instanceof Error ? error.message : "Failed to enqueue jobs",
      500
    );
  } finally {
    await boss.stop().catch(() => undefined);
  }

  return ok({
    status: "sending",
    total_recipients: total,
    enqueued: total,
  });
}
