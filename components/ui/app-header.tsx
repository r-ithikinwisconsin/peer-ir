"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export interface AppHeaderProps {
  title?: string;
  backHref?: string;
  action?: React.ReactNode;
  className?: string;
}

export function AppHeader({
  title,
  backHref,
  action,
  className,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border/80 bg-bg/90 px-3 backdrop-blur-sm",
        className,
      )}
    >
      {backHref ? (
        <Link
          href={backHref}
          aria-label="Back"
          className="grid h-10 w-10 place-items-center rounded-full text-primary transition hover:bg-primary-soft/60"
        >
          <ArrowLeft size={20} />
        </Link>
      ) : (
        <div className="w-10" aria-hidden />
      )}
      <h1 className="flex-1 text-center text-[15px] font-semibold tracking-tight">
        {title}
      </h1>
      <div className="flex h-10 w-10 items-center justify-end">{action}</div>
    </header>
  );
}
