import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableEmpty,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/ui/data-table";

export type MonitorEventRow = {
  id: string;
  event_type: string;
  occurred_at: string | null;
  email_send_id: string;
  metadata?: Record<string, unknown> | null;
  campaign_id?: string | null;
  campaign_name?: string | null;
  recipient_email?: string | null;
  recipient_first_name?: string | null;
  recipient_last_name?: string | null;
  send_status?: string | null;
  provider_message_id?: string | null;
  error_message?: string | null;
  sent_at?: string | null;
};

function formatContactName(firstName?: string | null, lastName?: string | null) {
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return name || "—";
}

function formatMetadata(metadata?: Record<string, unknown> | null) {
  if (!metadata || Object.keys(metadata).length === 0) return "—";
  const parts: string[] = [];
  if (typeof metadata.provider === "string") parts.push(`Provider: ${metadata.provider}`);
  if (typeof metadata.message_id === "string") parts.push(`Msg: ${metadata.message_id.slice(0, 12)}…`);
  if (typeof metadata.error_message === "string") parts.push(metadata.error_message);
  if (typeof metadata.event_type === "string" && parts.length === 0) {
    parts.push(metadata.event_type);
  }
  return parts.length > 0 ? parts.join(" · ") : JSON.stringify(metadata).slice(0, 80);
}

export function EventsMonitorTable({
  events,
  showCampaign = true,
  emptyMessage = "No events recorded yet.",
}: {
  events: MonitorEventRow[];
  showCampaign?: boolean;
  emptyMessage?: string;
}) {
  const colSpan = showCampaign ? 8 : 7;

  return (
    <DataTable>
      <DataTableHead>
        <DataTableRow>
          <DataTableHeaderCell>Event</DataTableHeaderCell>
          <DataTableHeaderCell>Recipient</DataTableHeaderCell>
          {showCampaign && <DataTableHeaderCell>Campaign</DataTableHeaderCell>}
          <DataTableHeaderCell>Send Status</DataTableHeaderCell>
          <DataTableHeaderCell>Time</DataTableHeaderCell>
          <DataTableHeaderCell>Provider ID</DataTableHeaderCell>
          <DataTableHeaderCell>Send ID</DataTableHeaderCell>
          <DataTableHeaderCell>Details</DataTableHeaderCell>
        </DataTableRow>
      </DataTableHead>
      <DataTableBody>
        {events.length === 0 ? (
          <DataTableEmpty colSpan={colSpan}>{emptyMessage}</DataTableEmpty>
        ) : (
          events.map((event) => (
            <DataTableRow key={event.id}>
              <DataTableCell>
                <StatusBadge kind="event" status={event.event_type} size="sm" />
              </DataTableCell>
              <DataTableCell>
                <p className="font-medium text-gray-900">
                  {event.recipient_email ?? "—"}
                </p>
                <p className="text-xs text-gray-500">
                  {formatContactName(event.recipient_first_name, event.recipient_last_name)}
                </p>
              </DataTableCell>
              {showCampaign && (
                <DataTableCell>
                  {event.campaign_id && event.campaign_name ? (
                    <Link
                      href={`/campaigns/${event.campaign_id}`}
                      className="text-sm font-medium text-primary hover:text-primary-dark"
                    >
                      {event.campaign_name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </DataTableCell>
              )}
              <DataTableCell>
                {event.send_status ? (
                  <StatusBadge kind="send" status={event.send_status} size="sm" />
                ) : (
                  "—"
                )}
              </DataTableCell>
              <DataTableCell className="text-sm text-gray-700">
                {event.occurred_at
                  ? new Date(event.occurred_at).toLocaleString()
                  : "—"}
              </DataTableCell>
              <DataTableCell className="font-mono text-xs text-gray-600">
                {event.provider_message_id
                  ? `${event.provider_message_id.slice(0, 16)}…`
                  : "—"}
              </DataTableCell>
              <DataTableCell className="font-mono text-xs text-gray-600">
                {event.email_send_id.slice(0, 8)}…
              </DataTableCell>
              <DataTableCell className="max-w-[220px] truncate text-xs text-gray-600">
                {event.error_message || formatMetadata(event.metadata)}
              </DataTableCell>
            </DataTableRow>
          ))
        )}
      </DataTableBody>
    </DataTable>
  );
}
