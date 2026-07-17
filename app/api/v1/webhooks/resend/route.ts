import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { createAdminClient } from "@/lib/supabase/admin";

const STATUS_PRIORITY: Record<string, number> = {
  pending: 0,
  failed: 1,
  sent: 2,
  bounced: 3,
  complained: 3,
  delivered: 4,
  opened: 5,
  clicked: 6,
};

const EVENT_TO_STATUS: Record<string, string | null> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.failed": "failed",
};

function canTransition(current: string, incoming: string) {
  return (STATUS_PRIORITY[incoming] ?? -1) > (STATUS_PRIORITY[current] ?? -1);
}

function extractEmailSendId(data: Record<string, unknown>) {
  if (data.tags && typeof data.tags === "object" && !Array.isArray(data.tags)) {
    const value = (data.tags as Record<string, unknown>).email_send_id;
    return typeof value === "string" ? value : null;
  }

  const tags = Array.isArray(data.tags) ? data.tags : [];
  const tag = tags.find((item) => {
    if (!item || typeof item !== "object") return false;
    const name = (item as { name?: unknown }).name;
    return name === "email_send_id";
  }) as { value?: unknown } | undefined;
  return typeof tag?.value === "string" ? tag.value : null;
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "RESEND_WEBHOOK_SECRET is not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  try {
    const webhook = new Webhook(secret);
    webhook.verify(rawBody, {
      "svix-id": svixId ?? "",
      "svix-timestamp": svixTimestamp ?? "",
      "svix-signature": svixSignature ?? "",
    });
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: true });
  }

  const payload = body as { type?: string; data?: Record<string, unknown> };
  const eventType = typeof payload.type === "string" ? payload.type : "";
  const data = payload.data && typeof payload.data === "object" ? payload.data : {};

  const nextStatus = EVENT_TO_STATUS[eventType];
  if (!nextStatus) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const webhookEventId = svixId as string;

  let emailSendId = extractEmailSendId(data);
  const providerMessageId =
    typeof data.email_id === "string"
      ? data.email_id
      : typeof data.message_id === "string"
      ? data.message_id
      : typeof data.id === "string"
      ? data.id
      : null;

  if (!emailSendId && providerMessageId) {
    const { data: sendByProvider } = await admin
      .from("email_sends")
      .select("id")
      .eq("provider_message_id", providerMessageId)
      .maybeSingle();
    emailSendId = sendByProvider?.id ?? null;
  }

  if (!emailSendId) return NextResponse.json({ ok: true });

  const { data: existingEvent } = await admin
    .from("email_events")
    .select("id")
    .eq("webhook_event_id", webhookEventId)
    .maybeSingle();
  if (existingEvent) return NextResponse.json({ ok: true });

  const { data: sendRow, error: sendError } = await admin
    .from("email_sends")
    .select("id,status,contact_id")
    .eq("id", emailSendId)
    .single();

  if (sendError || !sendRow) return NextResponse.json({ ok: true });

  if (canTransition(sendRow.status, nextStatus)) {
    await admin
      .from("email_sends")
      .update({ status: nextStatus })
      .eq("id", emailSendId);
  }

  const occurredAtRaw = typeof data.created_at === "string" ? data.created_at : null;
  const occurredAt =
    occurredAtRaw && !Number.isNaN(Date.parse(occurredAtRaw)) ? new Date(occurredAtRaw).toISOString() : undefined;

  const { error: eventInsertError } = await admin.from("email_events").insert({
    email_send_id: emailSendId,
    webhook_event_id: webhookEventId,
    event_type: nextStatus,
    metadata: {
      event_type: eventType,
      provider_message_id: providerMessageId,
      webhook_event_id: webhookEventId,
      raw: data,
    },
    ...(occurredAt ? { occurred_at: occurredAt } : {}),
  });
  if (eventInsertError && eventInsertError.code !== "23505") {
    return NextResponse.json({ error: "Failed to persist webhook event" }, { status: 500 });
  }

  if (nextStatus === "bounced" || nextStatus === "complained") {
    const contactStatus = nextStatus === "bounced" ? "bounced" : "complained";
    await admin
      .from("contacts")
      .update({ status: contactStatus })
      .eq("id", sendRow.contact_id);
  }

  return NextResponse.json({ ok: true });
}
