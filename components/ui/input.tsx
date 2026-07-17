"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, iconPosition = "left", ...props }, ref) => {
    const hasIcon = !!icon;

    return (
      <div className="relative">
        {hasIcon && iconPosition === "left" && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "block h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            hasIcon && iconPosition === "left" && "pl-10",
            hasIcon && iconPosition === "right" && "pr-10",
            className
          )}
          ref={ref}
          {...props}
        />
        {hasIcon && iconPosition === "right" && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
