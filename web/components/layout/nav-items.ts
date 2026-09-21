import type { LucideIcon } from "lucide-react";
import { Bell, Home, ShieldCheck, User } from "lucide-react";
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

  items.push({
    key: "profile",
    label: "Profile",
    href: `/profile/${user.id}`,
    icon: User,
  });

  return items;
}
