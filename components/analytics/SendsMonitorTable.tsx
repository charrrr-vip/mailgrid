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

export type MonitorSendRow = {
  id: string;
  status: string;
  campaign_id: string;
  campaign_name?: string | null;
  recipient_email?: string | null;
  recipient_first_name?: string | null;
  recipient_last_name?: string | null;
  sent_at?: string | null;
  created_at?: string | null;
  provider_message_id?: string | null;
  error_message?: string | null;
};

function formatContactName(firstName?: string | null, lastName?: string | null) {
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return name || "—";
}

export function SendsMonitorTable({
  sends,
  emptyMessage = "No sends recorded yet.",
}: {
  sends: MonitorSendRow[];
  emptyMessage?: string;
}) {
  return (
    <DataTable>
      <DataTableHead>
        <DataTableRow>
          <DataTableHeaderCell>Status</DataTableHeaderCell>
          <DataTableHeaderCell>Recipient</DataTableHeaderCell>
          <DataTableHeaderCell>Campaign</DataTableHeaderCell>
          <DataTableHeaderCell>Queued</DataTableHeaderCell>
          <DataTableHeaderCell>Sent At</DataTableHeaderCell>
          <DataTableHeaderCell>Provider ID</DataTableHeaderCell>
          <DataTableHeaderCell>Send ID</DataTableHeaderCell>
          <DataTableHeaderCell>Error</DataTableHeaderCell>
        </DataTableRow>
      </DataTableHead>
      <DataTableBody>
        {sends.length === 0 ? (
          <DataTableEmpty colSpan={8}>{emptyMessage}</DataTableEmpty>
        ) : (
          sends.map((send) => (
            <DataTableRow key={send.id}>
              <DataTableCell>
                <StatusBadge kind="send" status={send.status} size="sm" />
              </DataTableCell>
              <DataTableCell>
                <p className="font-medium text-gray-900">
                  {send.recipient_email ?? "—"}
                </p>
                <p className="text-xs text-gray-500">
                  {formatContactName(send.recipient_first_name, send.recipient_last_name)}
                </p>
              </DataTableCell>
              <DataTableCell>
                {send.campaign_name ? (
                  <Link
                    href={`/campaigns/${send.campaign_id}`}
                    className="text-sm font-medium text-primary hover:text-primary-dark"
                  >
                    {send.campaign_name}
                  </Link>
                ) : (
                  "—"
                )}
              </DataTableCell>
              <DataTableCell className="text-sm text-gray-700">
                {send.created_at ? new Date(send.created_at).toLocaleString() : "—"}
              </DataTableCell>
              <DataTableCell className="text-sm text-gray-700">
                {send.sent_at ? new Date(send.sent_at).toLocaleString() : "—"}
              </DataTableCell>
              <DataTableCell className="font-mono text-xs text-gray-600">
                {send.provider_message_id
                  ? `${send.provider_message_id.slice(0, 16)}…`
                  : "—"}
              </DataTableCell>
              <DataTableCell className="font-mono text-xs text-gray-600">
                {send.id.slice(0, 8)}…
              </DataTableCell>
              <DataTableCell className="max-w-[200px] truncate text-xs text-red-600">
                {send.error_message ?? "—"}
              </DataTableCell>
            </DataTableRow>
          ))
        )}
      </DataTableBody>
    </DataTable>
  );
}
