"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { syncAppBadge } from "@/lib/app-badge";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

const POLL_INTERVAL_MS = 30_000;

export function AppShell({
  children,
  rightRail,
}: {
  children: React.ReactNode;
  rightRail?: React.ReactNode;
}) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    async function poll() {
      try {
        const { count } = await api.getUnreadCount();
        if (!cancelled) {
          setUnreadCount(count);
          syncAppBadge(count);
        }
      } catch {
        // silent — the badge just won't update this cycle
      }
      if (isAdmin) {
        try {
          const pending = await api.getPendingPosts();
          if (!cancelled) setPendingCount(pending.length);
        } catch {
          // silent — same as above
        }
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, isAdmin]);

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen">
      <Sidebar user={user} unreadCount={unreadCount} pendingCount={pendingCount} />

      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-black/5 bg-background/80 px-4 py-3 backdrop-blur-sm md:hidden dark:border-white/10">
        <Link href="/feed" className="flex items-center gap-2 font-semibold text-brand">
          <Image src="/logo-mark.png" alt="" width={24} height={21} priority />
          DawoodTech Community
        </Link>
      </header>

      <div className="md:pl-64">
        <div className="mx-auto flex max-w-5xl gap-6 px-4 pb-20 pt-6 md:px-6 md:pb-10">
          <main className="min-w-0 flex-1">{children}</main>
          {rightRail && (
            <aside className="hidden w-72 shrink-0 lg:block">
              <div className="sticky top-6 space-y-4">{rightRail}</div>
            </aside>
          )}
        </div>
      </div>

      <BottomNav user={user} unreadCount={unreadCount} pendingCount={pendingCount} />
    </div>
  );
}
