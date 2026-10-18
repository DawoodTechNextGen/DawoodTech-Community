"use client";

import { Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { Leaderboard } from "@/lib/types";
import { LeaderboardRow } from "./leaderboard-list";

/** "Top this week" for the feed's right rail. */
export function LeaderboardCard() {
  const [board, setBoard] = useState<Leaderboard | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getLeaderboard()
      .then((b) => !cancelled && setBoard(b))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!board || board.top.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white/60 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-2 border-b border-black/5 px-5 py-3.5 dark:border-white/10">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-semibold">Top this week</h2>
        <Link href="/leaderboard" className="ml-auto text-xs font-medium text-brand hover:underline">
          See all
        </Link>
      </div>
      <ul className="divide-y divide-black/5 dark:divide-white/10">
        {board.top.slice(0, 5).map((entry) => (
          <LeaderboardRow key={entry.user.id} entry={entry} />
        ))}
      </ul>
    </div>
  );
}
