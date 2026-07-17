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
      .select("id, name")
      .eq("user_id", user.id);

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({ data: [], error: null });
    }

    const campaignIds = campaigns.map((c) => c.id);
    const campaignMap = new Map(campaigns.map((c) => [c.id, c.name]));

    let query = supabase
      .from("email_sends")
      .select(
        `
        id,
        status,
        campaign_id,
        sent_at,
        created_at,
        provider_message_id,
        error_message,
        contacts ( email, first_name, last_name )
      `
      )
      .in("campaign_id", campaignIds)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (dateFilter) {
      query = query.gte("created_at", dateFilter.toISOString());
    }

    const { data: sends, error } = await query;

    if (error) {
      return NextResponse.json(
        { data: null, error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    const enriched = (sends ?? []).map((send) => {
      const contact = Array.isArray(send.contacts) ? send.contacts[0] : send.contacts;
      const typedContact = contact as RawContact | null | undefined;

      return {
        id: send.id,
        status: send.status,
        campaign_id: send.campaign_id,
        campaign_name: campaignMap.get(send.campaign_id) ?? null,
        sent_at: send.sent_at,
        created_at: send.created_at,
        provider_message_id: send.provider_message_id,
        error_message: send.error_message,
        recipient_email: typedContact?.email ?? null,
        recipient_first_name: typedContact?.first_name ?? null,
        recipient_last_name: typedContact?.last_name ?? null,
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
