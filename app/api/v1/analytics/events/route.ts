import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RawContact = {
  email: string;
  first_name: string | null;
  last_name: string | null;
};

type RawCampaign = {
  id: string;
  name: string;
};

type RawEmailSend = {
  id: string;
  status: string;
  campaign_id: string;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  contacts: RawContact | RawContact[] | null;
  campaigns: RawCampaign | RawCampaign[] | null;
};

type RawEvent = {
  id: string;
  event_type: string;
  occurred_at: string;
  email_send_id: string;
  metadata: Record<string, unknown> | null;
  email_sends: RawEmailSend | RawEmailSend[] | null;
};

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { data: null, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";
    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? "100")));

    let dateFilter: Date | null = null;
    if (range === "7d") {
      dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "30d") {
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === "90d") {
      dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    }

    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id")
      .eq("user_id", user.id);

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({ data: [], error: null });
    }

    const campaignIds = campaigns.map((c) => c.id);

    const { data: sends } = await supabase
      .from("email_sends")
      .select("id")
      .in("campaign_id", campaignIds);

    if (!sends || sends.length === 0) {
      return NextResponse.json({ data: [], error: null });
    }

    const sendIds = sends.map((s) => s.id);

    let query = supabase
      .from("email_events")
      .select(
        `
        id,
        event_type,
        occurred_at,
        email_send_id,
        metadata,
        email_sends (
          id,
          status,
          campaign_id,
          provider_message_id,
          error_message,
          sent_at,
          contacts ( email, first_name, last_name ),
          campaigns ( id, name )
        )
      `
      )
      .in("email_send_id", sendIds)
      .order("occurred_at", { ascending: false })
      .limit(limit);

    if (dateFilter) {
      query = query.gte("occurred_at", dateFilter.toISOString());
    }

    const { data: events, error } = await query;

    if (error) {
      return NextResponse.json(
        { data: null, error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    const enriched = ((events ?? []) as RawEvent[]).map((event) => {
      const send = first(event.email_sends);
      const contact = first(send?.contacts ?? null);
      const campaign = first(send?.campaigns ?? null);

      return {
        id: event.id,
        event_type: event.event_type,
        occurred_at: event.occurred_at,
        email_send_id: event.email_send_id,
        metadata: event.metadata,
        campaign_id: send?.campaign_id ?? campaign?.id ?? null,
        campaign_name: campaign?.name ?? null,
        recipient_email: contact?.email ?? null,
        recipient_first_name: contact?.first_name ?? null,
        recipient_last_name: contact?.last_name ?? null,
        send_status: send?.status ?? null,
        provider_message_id: send?.provider_message_id ?? null,
        error_message: send?.error_message ?? null,
        sent_at: send?.sent_at ?? null,
      };
    });

    return NextResponse.json({ data: enriched, error: null });
  } catch (e) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INTERNAL_ERROR",
          message: e instanceof Error ? e.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
