import { cn } from "@/lib/cn";

export interface ProgressBarProps {
  step: number;
  total: number;
  className?: string;
}

export function ProgressBar({ step, total, className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (step / total) * 100));
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>
          Step {step} of {total}
        </span>
        <span className="tabular-nums">{Math.round(pct)}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={step}
        className="h-1 w-full overflow-hidden rounded-full bg-border/80"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
