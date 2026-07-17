"use client";

import {
  CheckCircle2,
  Eye,
  FileText,
  MailCheck,
  Minus,
  MousePointerClick,
  Send,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type StatCardIconName =
  | "users"
  | "file-text"
  | "send"
  | "mail-check"
  | "check-circle-2"
  | "eye"
  | "mouse-pointer-click";

const iconMap: Record<StatCardIconName, LucideIcon> = {
  users: Users,
  "file-text": FileText,
  send: Send,
  "mail-check": MailCheck,
  "check-circle-2": CheckCircle2,
  eye: Eye,
  "mouse-pointer-click": MousePointerClick,
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: StatCardIconName;
  change?: number;
  changeLabel?: string;
  suffix?: string;
  tone?: "blue" | "green" | "cyan" | "indigo" | "gray";
}

const toneStyles = {
  blue: {
    card: "border-blue-100 bg-blue-50/60",
    icon: "border-blue-100 bg-blue-100 text-blue-700",
  },
  green: {
    card: "border-emerald-100 bg-emerald-50/60",
    icon: "border-emerald-100 bg-emerald-100 text-emerald-700",
  },
  cyan: {
    card: "border-cyan-100 bg-cyan-50/60",
    icon: "border-cyan-100 bg-cyan-100 text-cyan-700",
  },
  indigo: {
    card: "border-indigo-100 bg-indigo-50/60",
    icon: "border-indigo-100 bg-indigo-100 text-indigo-700",
  },
  gray: {
    card: "border-gray-200 bg-[#F8F8F9]",
    icon: "border-gray-200 bg-white text-gray-600",
  },
};

export function StatCard({
  title,
  value,
  icon,
  change,
  changeLabel,
  suffix,
  tone = "gray",
}: StatCardProps) {
  const Icon = iconMap[icon];
  const styles = toneStyles[tone];
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className={cn("rounded-lg border p-5", styles.card)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-600">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
            {value}
            {suffix && (
              <span className="ml-1 text-sm font-normal text-gray-600">{suffix}</span>
            )}
          </p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
                  isNegative ? "text-destructive" : "text-gray-600"
                )}
              >
                {isPositive && <TrendingUp className="h-3 w-3" />}
                {isNegative && <TrendingDown className="h-3 w-3" />}
                {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
                {Math.abs(change)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-gray-600">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border",
            styles.icon
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
