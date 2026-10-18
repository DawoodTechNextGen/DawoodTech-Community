import type { LucideIcon } from "lucide-react";
import { BarChart3, Bell, Home, Search, ShieldCheck, Trophy, User, Users } from "lucide-react";
import type { PublicUser } from "@/lib/types";

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

export function buildNavItems(
  user: PublicUser,
  unreadCount: number,
  pendingCount: number,
): NavItem[] {
  // Most-used first: on phones only the first few fit in the bottom bar.
  const items: NavItem[] = [
    { key: "feed", label: "Home", href: "/feed", icon: Home },
    {
      key: "notifications",
      label: "Notifications",
      href: "/notifications",
      icon: Bell,
      badge: unreadCount,
    },
  ];
  if (user.role === "admin") {
    items.push({
      key: "review",
      label: "Review queue",
      href: "/admin/review",
      icon: ShieldCheck,
      badge: pendingCount,
    });
  }
  items.push(
    { key: "search", label: "Search", href: "/search", icon: Search },
    { key: "leaderboard", label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  );
  if (user.role === "admin") {
    items.push(
      { key: "insights", label: "Insights", href: "/admin/insights", icon: BarChart3 },
      { key: "users", label: "Users", href: "/admin/users", icon: Users },
    );
  }
  items.push({
    key: "profile",
    label: "Profile",
    href: `/profile/${user.id}`,
    icon: User,
  });

  return items;
}
