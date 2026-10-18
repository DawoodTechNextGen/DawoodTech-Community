"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { PublicUser } from "@/lib/types";
import { buildNavItems, type NavItem } from "./nav-items";

/** A phone bar fits five tabs; past that, the rest go under "More". */
const MAX_TABS = 5;

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
  const [moreOpen, setMoreOpen] = useState(false);
  const items = buildNavItems(user, unreadCount, pendingCount);
  const overflow = items.length > MAX_TABS;
  const tabs = overflow ? items.slice(0, MAX_TABS - 1) : items;
  const more = overflow ? items.slice(MAX_TABS - 1) : [];

  const isActive = (item: NavItem) =>
    pathname === item.href || (item.key === "feed" && pathname === "/");
  const moreActive = more.some(isActive);

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-20 md:hidden" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute bottom-[calc(4rem+env(safe-area-inset-bottom))] right-3 w-48 overflow-hidden rounded-2xl border border-black/10 bg-background shadow-xl dark:border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {more.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium ${
                    isActive(item) ? "text-brand" : "hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-black/5 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden dark:border-white/10">
        {tabs.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
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
              <span className="max-w-full truncate">
                {item.label === "Review queue" ? "Review" : item.label}
              </span>
            </Link>
          );
        })}
        {overflow && (
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
              moreActive || moreOpen ? "text-brand" : "text-foreground/50"
            }`}
          >
            <MoreHorizontal className="h-5 w-5" />
            More
          </button>
        )}
      </nav>
    </>
  );
}
