import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-border bg-muted text-muted-foreground",
        primary: "border-border bg-muted text-foreground",
        success: "border-border bg-muted text-foreground",
        warning: "border-border bg-muted text-foreground",
        danger: "border-destructive/20 bg-destructive/5 text-destructive",
        info: "border-border bg-muted text-foreground",
      },
      size: {
        sm: "px-1.5 py-0 text-[10px]",
        default: "px-2 py-0.5 text-xs",
        lg: "px-2.5 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({
  className,
  variant,
  size,
  dot,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />}
      {children}
    </span>
  );
}
