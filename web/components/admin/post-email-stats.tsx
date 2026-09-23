"use client";

import { Mail, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/format";
import type { PostEmailStatsResponse } from "@/lib/types";

const MODE_LABELS: Record<PostEmailStatsResponse["mode"], string | null> = {
  live: null,
  test: "Test mode: only the test address is emailed",
  dry_run: "Dry run: recipients are logged, nothing is sent",
};

/** Per-post counts from the intern email queue (queued / sent / failed). */
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
        <h2 className="text-sm font-semibold">Intern email notifications</h2>
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
      ) : !data ? null : data.posts.length === 0 ? (
        <p className="text-sm text-foreground/50">No post emails have been queued yet.</p>
      ) : (
        <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/5 bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
          {data.posts.map((p) => (
            <li key={p.postId} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3">
              <div className="min-w-0 flex-1 basis-48">
                <Link
                  href={`/post/${p.postId}`}
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {p.title}
                </Link>
                {p.notifiedAt && (
                  <span className="text-xs text-foreground/40">
                    Queued {formatRelativeTime(p.notifiedAt)}
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 text-xs font-medium">
                <Count label="queued" value={p.queued} className="bg-brand/10 text-brand" />
                <Count
                  label="sent"
                  value={p.sent}
                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                />
                <Count
                  label="failed"
                  value={p.failed}
                  className="bg-red-500/10 text-red-600 dark:text-red-400"
                />
                {p.skipped > 0 && (
                  <Count
                    label="skipped"
                    value={p.skipped}
                    className="bg-black/5 text-foreground/60 dark:bg-white/10"
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
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
