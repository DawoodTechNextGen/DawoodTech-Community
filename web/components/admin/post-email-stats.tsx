"use client";

import { Mail, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import type { PostEmailStatsResponse } from "@/lib/types";

const MODE_LABELS: Record<PostEmailStatsResponse["mode"], string | null> = {
  live: null,
  test: "Test mode: digests go only to the test address",
  dry_run: "Dry run: recipients are logged, nothing is sent",
};

function formatHour(hour: number): string {
  const suffix = hour < 12 ? "AM" : "PM";
  return `${hour % 12 === 0 ? 12 : hour % 12}:00 ${suffix}`;
}

function formatDay(day: string): string {
  return new Date(`${day}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Daily digest status: posts waiting for the next one, and recent digests' send counts. */
export function PostEmailStatsPanel() {
  const [data, setData] = useState<PostEmailStatsResponse | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(
    () =>
      api
        .getPostEmailStats()
        .then((stats) => {
          setData(stats);
          setError(false);
        })
        .catch(() => setError(true)),
    [],
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  async function load() {
    setLoading(true);
    await fetchStats();
    setLoading(false);
  }

  const modeLabel = data ? MODE_LABELS[data.mode] : null;

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <Mail className="h-4 w-4 text-brand" />
        <h2 className="text-sm font-semibold">Daily email digest</h2>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          aria-label="Refresh email stats"
          className="ml-auto rounded-lg p-1.5 text-foreground/50 transition-colors hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/5"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {modeLabel && (
        <p className="mb-3 rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400">
          {modeLabel}
        </p>
      )}

      {error ? (
        <p className="text-sm text-foreground/50">Couldn&apos;t load email stats.</p>
      ) : !data ? null : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-black/5 bg-white/60 px-4 py-3 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-medium">
              Next digest: {formatHour(data.digestHour)}{" "}
              <span className="font-normal text-foreground/50">({data.timeZone})</span>
            </p>
            {data.pendingPosts.length === 0 ? (
              <p className="mt-1 text-xs text-foreground/50">No posts waiting yet.</p>
            ) : (
              <>
                <p className="mt-1 text-xs text-foreground/50">
                  {data.pendingPosts.length} post{data.pendingPosts.length > 1 ? "s" : ""} waiting:
                </p>
                <ul className="mt-1.5 space-y-1">
                  {data.pendingPosts.map((p) => (
                    <li key={p.postId} className="truncate text-sm">
                      <Link href={`/post/${p.postId}`} className="hover:underline">
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {data.legacyQueued > 0 && (
              <p className="mt-2 text-xs text-foreground/50">
                {data.legacyQueued} earlier one-per-post email{data.legacyQueued > 1 ? "s" : ""} still
                sending.
              </p>
            )}
          </div>

          {data.digests.length === 0 ? (
            <p className="text-sm text-foreground/50">No digests have been sent yet.</p>
          ) : (
            <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/5 bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
              {data.digests.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3">
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="text-sm font-medium">{formatDay(d.day)}</p>
                    <span className="text-xs text-foreground/40">
                      {d.postCount} post{d.postCount > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex gap-1.5 text-xs font-medium">
                    <Count label="queued" value={d.queued} className="bg-brand/10 text-brand" />
                    <Count
                      label="sent"
                      value={d.sent}
                      className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    />
                    <Count
                      label="failed"
                      value={d.failed}
                      className="bg-red-500/10 text-red-600 dark:text-red-400"
                    />
                    {d.skipped > 0 && (
                      <Count
                        label="skipped"
                        value={d.skipped}
                        className="bg-black/5 text-foreground/60 dark:bg-white/10"
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function Count({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 ${className}`}>
      {value} {label}
    </span>
  );
}
