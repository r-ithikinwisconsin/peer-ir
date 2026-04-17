import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-lg bg-surface p-10 text-center shadow-card",
        className,
      )}
    >
      <div className="mb-2 grid h-12 w-12 place-items-center rounded-full bg-chip-bg text-text-muted">
        <Icon size={22} />
      </div>
      <h3 className="font-semibold">{title}</h3>
      {description && (
        <p className="max-w-xs text-sm text-text-muted">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
