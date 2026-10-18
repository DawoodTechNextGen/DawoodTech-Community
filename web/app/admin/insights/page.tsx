"use client";

import { BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ErrorBanner } from "@/components/ui/error-banner";
import { api } from "@/lib/api-client";
import { formatWait } from "@/lib/format";
import type { AdminStats } from "@/lib/types";
import { useRequireAuth } from "@/lib/use-require-auth";

/** Is the community getting used? Active members, daily activity, and
 *  whether new members come back. "Active" = posted, commented or reacted. */
export default function InsightsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [avgWait, setAvgWait] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.replace("/feed");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    Promise.all([api.getAdminStats(), api.getReviewStats()])
      .then(([s, r]) => {
        setStats(s);
        setAvgWait(r.avgWaitMinutes);
      })
      .catch(() => setError("Couldn't load insights."));
  }, [user]);

  if (authLoading || !user || user.role !== "admin") return null;

  const days = stats ? lastDays(stats.daily, 14) : [];
  const max = Math.max(1, ...days.map((d) => d.activeMembers));
  const returnRate =
    stats && stats.retention.joined > 0
      ? Math.round((stats.retention.returned / stats.retention.joined) * 100)
      : null;

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-brand" />
          <h1 className="text-lg font-semibold">Insights</h1>
        </div>
        {error && <ErrorBanner message={error} />}

        {stats && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Tile label="Active today" value={stats.activeMembers.today} />
              <Tile label="Active this week" value={stats.activeMembers.week} />
              <Tile label="Active this month" value={stats.activeMembers.month} />
              <Tile
                label="New members who came back"
                value={returnRate === null ? "—" : `${returnRate}%`}
                hint={
                  stats.retention.joined
                    ? `${stats.retention.returned} of ${stats.retention.joined}, a week+ after joining`
                    : "No sign-ups 8–37 days ago yet"
                }
              />
            </div>
            <Tile
              label="Average wait for post approval (30 days)"
              value={avgWait === null ? "—" : formatWait(avgWait)}
            />

            <div className="rounded-2xl border border-black/5 bg-white/60 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Active members per day</h2>
                <button
                  type="button"
                  onClick={() => setShowTable((t) => !t)}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  {showTable ? "Show chart" : "Show table"}
                </button>
              </div>

              {days.every((d) => d.activeMembers === 0) ? (
                <p className="py-8 text-center text-sm text-foreground/50">
                  No activity in the last 14 days.
                </p>
              ) : showTable ? (
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-foreground/50">
                    <tr>
                      <th className="py-1.5 font-medium">Day</th>
                      <th className="py-1.5 text-right font-medium">Active</th>
                      <th className="py-1.5 text-right font-medium">Posts</th>
                      <th className="py-1.5 text-right font-medium">Comments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/10">
                    {days.map((d) => (
                      <tr key={d.day}>
                        <td className="py-1.5">{formatDay(d.day)}</td>
                        <td className="py-1.5 text-right tabular-nums">{d.activeMembers}</td>
                        <td className="py-1.5 text-right tabular-nums">{d.posts}</td>
                        <td className="py-1.5 text-right tabular-nums">{d.comments}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div>
                  <div
                    className="flex h-40 items-end gap-0.5 border-b border-black/10 dark:border-white/15"
                    role="list"
                  >
                    {days.map((d) => (
                      <div
                        key={d.day}
                        role="listitem"
                        aria-label={`${formatDay(d.day)}: ${d.activeMembers} active, ${d.posts} posts, ${d.comments} comments`}
                        className="group relative flex h-full flex-1 items-end"
                      >
                        <div
                          className="w-full rounded-t bg-brand/80 transition-colors group-hover:bg-brand"
                          style={{ height: `${(d.activeMembers / max) * 100}%` }}
                        />
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-black/10 bg-background px-2.5 py-1.5 text-xs shadow-lg group-hover:block dark:border-white/10">
                          <p className="font-semibold">{formatDay(d.day)}</p>
                          <p>{d.activeMembers} active</p>
                          <p className="text-foreground/60">
                            {d.posts} posts · {d.comments} comments
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-1.5 flex justify-between text-xs text-foreground/50">
                    <span>{formatDay(days[0]!.day)}</span>
                    <span>Today</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Tile({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white/60 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <p className="text-xs text-foreground/50">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-foreground/50">{hint}</p>}
    </div>
  );
}

type Day = AdminStats["daily"][number];

/** The last `count` calendar days, oldest first; days with no activity are zeros
 *  (so one busy day never stretches into a single full-width bar). */
function lastDays(daily: Day[], count: number): Day[] {
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const out: Day[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    out.push(byDay.get(key) ?? { day: key, activeMembers: 0, posts: 0, comments: 0 });
  }
  return out;
}

function formatDay(day: string): string {
  return new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
