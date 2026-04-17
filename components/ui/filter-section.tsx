"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

export interface FilterSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  activeCount?: number;
  className?: string;
}

export function FilterSection({
  title,
  defaultOpen = true,
  children,
  activeCount,
  className,
}: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={cn("border-b border-border last:border-b-0", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-3.5 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold">{title}</span>
          {activeCount ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-soft px-1.5 text-[11px] font-bold text-primary-soft-fg">
              {activeCount}
            </span>
          ) : null}
        </div>
        <ChevronDown
          size={16}
          className={cn(
            "text-text-subtle transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="pb-4 pt-1">{children}</div>}
    </section>
  );
}
