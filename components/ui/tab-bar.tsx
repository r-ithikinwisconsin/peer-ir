"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Home,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}

const tabs: Tab[] = [
  {
    href: "/feed",
    label: "Feed",
    icon: Home,
    match: (p) => p === "/feed" || p.startsWith("/cases"),
  },
  {
    href: "/my-cases",
    label: "My Cases",
    icon: ClipboardList,
    match: (p) => p.startsWith("/my-cases"),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
    match: (p) => p.startsWith("/profile"),
  },
];

export function BottomTabBar() {
  const pathname = usePathname() ?? "";
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm shadow-tab-bar"
    >
      <ul className="mx-auto flex max-w-[720px] items-stretch">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors",
                  active ? "text-primary" : "text-text-subtle",
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function BottomTabBarSpacer() {
  return <div aria-hidden className="h-20" />;
}
