export type StatusTone = {
  label: string;
  bg: string;
  border: string;
  text: string;
  dot: string;
};

export const CAMPAIGN_STATUS: Record<string, StatusTone> = {
  draft: {
    label: "Draft",
    bg: "bg-gray-100",
    border: "border-gray-300",
    text: "text-gray-700",
    dot: "bg-gray-500",
  },
  scheduled: {
    label: "Scheduled",
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
    dot: "bg-sky-500",
  },
  sending: {
    label: "Sending",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    dot: "bg-amber-500",
  },
  paused: {
    label: "Paused",
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    dot: "bg-violet-500",
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-gray-100",
    border: "border-gray-300",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
  failed: {
    label: "Failed",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    dot: "bg-red-500",
  },
};

export const EMAIL_SEND_STATUS: Record<string, StatusTone> = {
  pending: {
    label: "Pending",
    bg: "bg-gray-100",
    border: "border-gray-300",
    text: "text-gray-700",
    dot: "bg-gray-500",
  },
  sent: {
    label: "Sent",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  delivered: {
    label: "Delivered",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  opened: {
    label: "Opened",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    text: "text-cyan-700",
    dot: "bg-cyan-500",
  },
  clicked: {
    label: "Clicked",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-700",
    dot: "bg-indigo-500",
  },
  bounced: {
    label: "Bounced",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    dot: "bg-orange-500",
  },
  complained: {
    label: "Complained",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  failed: {
    label: "Failed",
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-800",
    dot: "bg-red-600",
  },
};

export const EVENT_TYPE_STATUS: Record<string, StatusTone> = {
  sent: EMAIL_SEND_STATUS.sent,
  delivered: EMAIL_SEND_STATUS.delivered,
  opened: EMAIL_SEND_STATUS.opened,
  clicked: EMAIL_SEND_STATUS.clicked,
  bounced: EMAIL_SEND_STATUS.bounced,
  complained: EMAIL_SEND_STATUS.complained,
  failed: EMAIL_SEND_STATUS.failed,
};

export function getCampaignStatus(status: string): StatusTone {
  return (
    CAMPAIGN_STATUS[status] ?? {
      label: status,
      bg: "bg-gray-100",
      border: "border-gray-300",
      text: "text-gray-700",
      dot: "bg-gray-500",
    }
  );
}

export function getEmailSendStatus(status: string): StatusTone {
  return (
    EMAIL_SEND_STATUS[status] ?? {
      label: status,
      bg: "bg-gray-100",
      border: "border-gray-300",
      text: "text-gray-700",
      dot: "bg-gray-500",
    }
  );
}

export function getEventTypeStatus(eventType: string): StatusTone {
  return (
    EVENT_TYPE_STATUS[eventType] ?? {
      label: eventType,
      bg: "bg-gray-100",
      border: "border-gray-300",
      text: "text-gray-700",
      dot: "bg-gray-500",
    }
  );
}
