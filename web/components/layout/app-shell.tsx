"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

export function AppShell({
  children,
  rightRail,
}: {
  children: React.ReactNode;
  rightRail?: React.ReactNode;
}) {
  const { user } = useAuth();
  // Both counts arrive live over the notifications socket.
  const { unreadCount, pendingCount } = useNotifications();

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
