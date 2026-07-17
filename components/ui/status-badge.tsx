import { cn } from "@/lib/utils";
import {
  getCampaignStatus,
  getEmailSendStatus,
  getEventTypeStatus,
} from "@/lib/status/colors";

type StatusKind = "campaign" | "send" | "event";

const resolvers = {
  campaign: getCampaignStatus,
  send: getEmailSendStatus,
  event: getEventTypeStatus,
} as const;

export function StatusBadge({
  kind,
  status,
  size = "default",
  dot = true,
  className,
}: {
  kind: StatusKind;
  status: string;
  size?: "sm" | "default" | "lg";
  dot?: boolean;
  className?: string;
}) {
  const tone = resolvers[kind](status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-medium capitalize",
        tone.bg,
        tone.border,
        tone.text,
        size === "sm" && "px-1.5 py-0 text-[10px]",
        size === "default" && "px-2 py-0.5 text-xs",
        size === "lg" && "px-2.5 py-1 text-sm",
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />}
      {tone.label}
    </span>
  );
}
