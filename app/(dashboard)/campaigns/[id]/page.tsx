import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Send,
  CheckCircle2,
  Eye,
  MousePointerClick,
  AlertTriangle,
  ArrowLeft,
  Clock,
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  EventsMonitorTable,
  type MonitorEventRow,
} from "@/components/analytics/EventsMonitorTable";

type CampaignStats = {
  total?: number;
  pending?: number;
  sent?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
  bounced?: number;
  complained?: number;
  failed?: number;
};


export default async function CampaignDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return notFound();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id,name,status,created_at,scheduled_at,started_at,completed_at,stats")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!campaign) return notFound();

  const { data: sends } = await supabase
    .from("email_sends")
    .select("id")
    .eq("campaign_id", campaign.id);

  const sendIds = (sends ?? []).map((row) => row.id);

  const { data: eventsRaw } =
    sendIds.length > 0
      ? await supabase
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
              provider_message_id,
              error_message,
              sent_at,
              contacts ( email, first_name, last_name )
            )
          `
          )
          .in("email_send_id", sendIds)
          .order("occurred_at", { ascending: false })
          .limit(50)
      : { data: [] };

  const events: MonitorEventRow[] = (eventsRaw ?? []).map((event) => {
    const send = Array.isArray(event.email_sends)
      ? event.email_sends[0]
      : event.email_sends;
    const contact = Array.isArray(send?.contacts) ? send.contacts[0] : send?.contacts;

    return {
      id: event.id,
      event_type: event.event_type,
      occurred_at: event.occurred_at,
      email_send_id: event.email_send_id,
      metadata: event.metadata as Record<string, unknown> | null,
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      recipient_email: contact?.email ?? null,
      recipient_first_name: contact?.first_name ?? null,
      recipient_last_name: contact?.last_name ?? null,
      send_status: send?.status ?? null,
      provider_message_id: send?.provider_message_id ?? null,
      error_message: send?.error_message ?? null,
      sent_at: send?.sent_at ?? null,
    };
  });

  const stats = (campaign.stats ?? {}) as CampaignStats;
  const total = stats.total ?? 0;
  const delivered = stats.delivered ?? 0;
  const opened = stats.opened ?? 0;
  const clicked = stats.clicked ?? 0;
  const bounced = stats.bounced ?? 0;

  const openRate = total > 0 ? ((opened / total) * 100).toFixed(1) : "0.0";
  const clickRate = total > 0 ? ((clicked / total) * 100).toFixed(1) : "0.0";
  const deliveryRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : "0.0";


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/campaigns"
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {campaign.name}
          </h1>
          <div className="mt-2 flex items-center gap-4">
            <StatusBadge kind="campaign" status={campaign.status} size="lg" />
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <Calendar className="h-4 w-4" />
              Created {new Date(campaign.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        <Link href="/analytics">
          <Button variant="outline">
            View Full Analytics
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Recipients" value={total.toLocaleString()} icon="send" />
        <StatCard
          title="Delivered"
          value={delivered.toLocaleString()}
          suffix={`(${deliveryRate}%)`}
          icon="check-circle-2"
        />
        <StatCard
          title="Opened"
          value={opened.toLocaleString()}
          suffix={`(${openRate}%)`}
          icon="eye"
        />
        <StatCard
          title="Clicked"
          value={clicked.toLocaleString()}
          suffix={`(${clickRate}%)`}
          icon="mouse-pointer-click"
        />
      </div>

      {/* Timeline & Events */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Campaign Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Campaign Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <TimelineItem
                label="Created"
                date={campaign.created_at}
                active
              />
              {campaign.scheduled_at && (
                <TimelineItem
                  label="Scheduled"
                  date={campaign.scheduled_at}
                  active
                />
              )}
              {campaign.started_at && (
                <TimelineItem
                  label="Started Sending"
                  date={campaign.started_at}
                  active
                />
              )}
              {campaign.completed_at && (
                <TimelineItem
                  label="Completed"
                  date={campaign.completed_at}
                  active
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Delivery Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Successful", value: delivered },
                { label: "Bounced", value: bounced },
                { label: "Complaints", value: stats.complained ?? 0 },
                { label: "Failed", value: stats.failed ?? 0 },
              ].map((item) => (
                <div key={item.label} className="rounded-md border border-border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-muted-foreground" />
            Event Activity Monitor
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <EventsMonitorTable
            events={events}
            showCampaign={false}
            emptyMessage="No events recorded yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineItem({
  label,
  date,
  active,
}: {
  label: string;
  date: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          active
            ? "bg-muted text-foreground"
            : "bg-slate-100 text-slate-400 dark:bg-slate-800"
        }`}
      >
        <Clock className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-slate-900 dark:text-white">{label}</p>
        <p className="text-sm text-slate-500">
          {new Date(date).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
