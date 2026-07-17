"use client";

import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-2",
  xl: "h-10 w-10 border-2",
};

export function Spinner({ size = "md", className, label }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={cn(
          "animate-spin rounded-full border-border border-t-foreground",
          sizeClasses[size],
          className
        )}
      />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}

interface LoadingOverlayProps {
  visible: boolean;
  label?: string;
  blur?: boolean;
}

export function LoadingOverlay({
  visible,
  label = "Loading...",
  blur = true,
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-background/80",
        blur && "backdrop-blur-sm"
      )}
    >
      <Spinner size="lg" label={label} />
    </div>
  );
}

interface PageLoaderProps {
  label?: string;
}

export function PageLoader({ label = "Loading..." }: PageLoaderProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <Spinner size="lg" label={label} />
    </div>
  );
}
