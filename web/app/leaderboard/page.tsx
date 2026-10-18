"use client";

import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { LeaderboardRow } from "@/components/community/leaderboard-list";
import { AppShell } from "@/components/layout/app-shell";
import { ErrorBanner } from "@/components/ui/error-banner";
import { api } from "@/lib/api-client";
import type { Leaderboard } from "@/lib/types";
import { useRequireAuth } from "@/lib/use-require-auth";

export default function LeaderboardPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const [board, setBoard] = useState<Leaderboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api
      .getLeaderboard()
      .then(setBoard)
      .catch(() => setError("Couldn't load the leaderboard."));
  }, [user]);

  if (authLoading || !user) return null;

  const meInTop = board?.top.some((e) => e.user.id === user.id);

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h1 className="text-lg font-semibold">Leaderboard</h1>
          <span className="text-xs text-foreground/50">last 7 days</span>
        </div>
        <p className="text-sm text-foreground/60">
          5 points per post, 2 per comment, 1 per reaction you receive. Show up, help out, share
          your wins.
        </p>

        {error && <ErrorBanner message={error} />}

        {board && (
          <div className="overflow-hidden rounded-2xl border border-black/5 bg-white/60 shadow-sm dark:border-white/10 dark:bg-white/5">
            {board.top.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-foreground/50">
                No activity this week yet — be the first on the board!
              </p>
            ) : (
              <ul className="divide-y divide-black/5 dark:divide-white/10">
                {board.top.map((entry) => (
                  <LeaderboardRow
                    key={entry.user.id}
                    entry={entry}
                    highlight={entry.user.id === user.id}
                    detailed
                  />
                ))}
              </ul>
            )}
            {board.me && !meInTop && (
              <ul className="border-t-2 border-dashed border-black/10 dark:border-white/10">
                <LeaderboardRow entry={board.me} highlight detailed />
              </ul>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
