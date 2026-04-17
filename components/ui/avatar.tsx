import { cn } from "@/lib/cn";

export interface AvatarProps {
  name?: string | null;
  size?: number;
  className?: string;
}

function initials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return parts.map((p) => p[0]!.toUpperCase()).join("");
}

export function Avatar({ name, size = 72, className }: AvatarProps) {
  const letters = name ? initials(name) : "";
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-primary-soft font-semibold text-primary-soft-fg",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-label={name ?? "Anonymous"}
    >
      {letters || (
        <svg
          width={Math.round(size * 0.5)}
          height={Math.round(size * 0.5)}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.5 0-7 1.8-7 4.5V20h14v-1.5C19 15.8 15.5 14 12 14z"
            fill="currentColor"
            opacity=".8"
          />
        </svg>
      )}
    </div>
  );
}
