import { cn } from "@/lib/cn";

export function CategoryPill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-full bg-chip-bg px-2 text-[10px] font-bold uppercase tracking-wider text-chip-fg",
        className,
      )}
    >
      {children}
    </span>
  );
}
