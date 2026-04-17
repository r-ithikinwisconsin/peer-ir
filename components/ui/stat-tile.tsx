import { cn } from "@/lib/cn";

export interface StatTileProps extends React.HTMLAttributes<HTMLDivElement> {
  value: React.ReactNode;
  label: string;
}

export function StatTile({ value, label, className, ...props }: StatTileProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg bg-surface p-4 shadow-card",
        className,
      )}
      {...props}
    >
      <span className="tabular-nums text-[28px] font-bold leading-none text-primary">
        {value}
      </span>
      <span className="label mt-1">{label}</span>
    </div>
  );
}
