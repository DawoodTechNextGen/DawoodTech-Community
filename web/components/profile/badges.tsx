"use client";

import { Award } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { Badge } from "@/lib/types";

/** Earned badges; on your own profile, the ones still to earn too (faded). */
export function ProfileBadges({ userId, isOwnProfile }: { userId: string; isOwnProfile: boolean }) {
  const [badges, setBadges] = useState<Badge[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getBadges(userId)
      .then((b) => !cancelled && setBadges(b))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!badges) return null;
  const shown = isOwnProfile ? badges : badges.filter((b) => b.earned);
  if (shown.length === 0) return null;

  return (
    <div className="rounded-2xl border border-black/5 bg-white/60 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="mb-3 flex items-center gap-2">
        <Award className="h-4 w-4 text-brand" />
        <h2 className="text-sm font-semibold">Badges</h2>
        <span className="text-xs text-foreground/50">
          {badges.filter((b) => b.earned).length}/{badges.length}
        </span>
      </div>
      <ul className="flex flex-wrap gap-2">
        {shown.map((badge) => (
          <li
            key={badge.key}
            title={badge.description}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
              badge.earned
                ? "border-brand/20 bg-brand/5"
                : "border-dashed border-black/10 text-foreground/40 grayscale dark:border-white/10"
            }`}
          >
            <span className="text-sm">{badge.emoji}</span>
            {badge.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
