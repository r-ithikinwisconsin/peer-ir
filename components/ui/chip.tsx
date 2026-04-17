"use client";

import { X } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  onRemove?: () => void;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { className, selected, onRemove, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={selected ?? undefined}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors",
        selected
          ? "bg-primary-soft text-primary-soft-fg"
          : "bg-chip-bg text-chip-fg hover:bg-chip-bg/80",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      {selected && onRemove && (
        <span
          role="button"
          aria-label="Remove"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="-mr-1 grid h-5 w-5 place-items-center rounded-full hover:bg-white/50"
        >
          <X size={12} strokeWidth={2.5} />
        </span>
      )}
    </button>
  );
});
