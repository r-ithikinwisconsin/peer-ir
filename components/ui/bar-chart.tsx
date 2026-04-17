import { cn } from "@/lib/cn";

export interface BarChartRow {
  id: string;
  label: string;
  pct: number;
  count: number;
  highlighted?: boolean;
}

export interface BarChartProps {
  rows: BarChartRow[];
  animate?: boolean;
  className?: string;
}

export function HorizontalBarChart({
  rows,
  animate = true,
  className,
}: BarChartProps) {
  return (
    <ul className={cn("flex flex-col gap-3.5", className)}>
      {rows.map((row) => (
        <BarRow key={row.id} row={row} animate={animate} />
      ))}
    </ul>
  );
}

function BarRow({ row, animate }: { row: BarChartRow; animate: boolean }) {
  const widthPct = Math.max(0, Math.min(100, row.pct));
  return (
    <li>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[15px]",
              row.highlighted ? "font-semibold" : "font-medium",
            )}
          >
            {row.label}
          </span>
          {row.highlighted && (
            <span className="inline-flex h-5 items-center rounded-full bg-primary-soft px-2 text-[10px] font-bold uppercase tracking-wider text-primary-soft-fg">
              You
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2 tabular-nums text-text-muted">
          <span
            className={cn(
              "text-[15px] font-semibold",
              row.highlighted ? "text-primary" : "text-text",
            )}
          >
            {widthPct.toFixed(0)}%
          </span>
          <span className="text-xs">
            n={row.count}
          </span>
        </div>
      </div>
      <div
        className={cn(
          "h-2 w-full overflow-hidden rounded-full bg-chip-bg",
          row.highlighted && "ring-1 ring-primary/30",
        )}
      >
        <div
          className={cn(
            "h-full rounded-full bg-primary",
            animate && "animate-bar-grow",
          )}
          style={
            {
              width: `${widthPct}%`,
              "--bar-width": `${widthPct}%`,
            } as React.CSSProperties
          }
        />
      </div>
    </li>
  );
}
