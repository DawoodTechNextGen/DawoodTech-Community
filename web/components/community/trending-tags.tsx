"use client";

import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

/** The week's most-used #tags, for the feed's right rail. */
export function TrendingTags() {
  const [tags, setTags] = useState<{ tag: string; count: number }[]>([]);

  useEffect(() => {
    let cancelled = false;
    api
      .getTrendingTags()
      .then((t) => !cancelled && setTags(t))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (tags.length === 0) return null;

  return (
    <div className="rounded-2xl border border-black/5 bg-white/60 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-brand" />
        <h2 className="text-sm font-semibold">Trending</h2>
      </div>
      <ul className="flex flex-wrap gap-2">
        {tags.map(({ tag, count }) => (
          <li key={tag}>
            <Link
              href={`/tags/${tag}`}
              className="flex items-center gap-1 rounded-full bg-brand/5 px-3 py-1 text-xs font-medium text-brand hover:bg-brand/10"
            >
              #{tag}
              <span className="text-foreground/40">{count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
