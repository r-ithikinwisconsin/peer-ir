import { cn } from "@/lib/cn";

export interface SectionHeadingProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  action?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function SectionHeading({
  title,
  action,
  size = "md",
  className,
  ...props
}: SectionHeadingProps) {
  const titleClass =
    size === "lg"
      ? "text-2xl font-bold tracking-tight"
      : size === "sm"
        ? "text-base font-semibold"
        : "text-[19px] font-bold tracking-tight";
  return (
    <div
      className={cn(
        "mt-1 mb-3 flex items-end justify-between gap-3",
        className,
      )}
      {...props}
    >
      <h2 className={titleClass}>{title}</h2>
      {action}
    </div>
  );
}
