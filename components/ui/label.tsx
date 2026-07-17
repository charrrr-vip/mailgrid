"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  optional?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, optional, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "mb-2 block text-sm font-medium text-gray-900",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-1 text-red-500" aria-hidden="true">
          *
        </span>
      )}
      {optional && (
        <span className="ml-1.5 text-xs font-normal text-gray-500">
          (optional)
        </span>
      )}
    </label>
  )
);
Label.displayName = "Label";
