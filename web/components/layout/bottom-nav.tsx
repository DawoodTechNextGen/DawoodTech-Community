"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PublicUser } from "@/lib/types";
import { buildNavItems } from "./nav-items";

export function BottomNav({
  user,
  unreadCount,
  pendingCount,
}: {
  user: PublicUser;
  unreadCount: number;
  pendingCount: number;
}) {
  const pathname = usePathname();
  const items = buildNavItems(user, unreadCount, pendingCount);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-black/5 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden dark:border-white/10">
      {items.map((item) => {
        const active =
          pathname === item.href || (item.key === "feed" && pathname === "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
              active ? "text-brand" : "text-foreground/50"
            }`}
          >
            <span className="relative">
              <Icon className={`h-5 w-5 ${active ? "fill-brand/15" : ""}`} />
              {!!item.badge && item.badge > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-semibold text-white">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </span>
            {item.label === "Review queue" ? "Review" : item.label}
          </Link>
        );
      })}
    </nav>
  );
}
