"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface DecisionCardProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
  label: string;
  description?: string;
  selected?: boolean;
}

export function DecisionCard({
  label,
  description,
  selected,
  className,
  ...props
}: DecisionCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "group flex w-full items-center gap-4 rounded-lg bg-surface p-4 text-left shadow-card outline-none transition-colors",
        selected
          ? "ring-2 ring-primary"
          : "hover:shadow-card-hover",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
          selected ? "border-primary bg-primary" : "border-border",
        )}
      >
        {selected && (
          <Check size={14} strokeWidth={3} className="text-primary-fg" />
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-semibold">{label}</span>
        {description && (
          <span className="text-sm text-text-muted">{description}</span>
        )}
      </div>
    </button>
  );
}
