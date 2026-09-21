"use client";

import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import type { PublicUser } from "@/lib/types";
import { buildNavItems } from "./nav-items";

export function Sidebar({
  user,
  unreadCount,
  pendingCount,
}: {
  user: PublicUser;
  unreadCount: number;
  pendingCount: number;
}) {
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const items = buildNavItems(user, unreadCount, pendingCount);

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-black/5 bg-background/60 px-4 py-6 backdrop-blur-sm md:flex">
      <Link href="/feed" className="flex items-center gap-2 px-2 font-bold text-brand">
        <Image src="/logo-mark.png" alt="" width={28} height={24} priority />
        <span className="text-lg">DawoodTech</span>
      </Link>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active =
            pathname === item.href || (item.key === "feed" && pathname === "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand text-brand-foreground shadow-md shadow-brand/20"
                  : "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
              {!!item.badge && item.badge > 0 && (
                <span
                  className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                    active ? "bg-white/25 text-white" : "bg-rose-500 text-white"
                  }`}
                >
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <Link
        href={`/profile/${user.id}`}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
      >
        <Avatar name={user.fullName} src={user.avatarUrl} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.fullName}</p>
          <p className="truncate text-xs text-foreground/40">@{user.username}</p>
        </div>
        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            await logout();
            router.replace("/login");
          }}
          aria-label="Log out"
          className="rounded-lg p-1.5 text-foreground/40 transition-colors hover:bg-black/10 hover:text-foreground dark:hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </Link>
    </aside>
  );
}
