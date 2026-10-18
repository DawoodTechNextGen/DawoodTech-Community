"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PostCard } from "@/components/posts/post-card";
import { Avatar } from "@/components/ui/avatar";
import { api } from "@/lib/api-client";
import { applyReaction, saveReaction } from "@/lib/reactions";
import type { Post, PublicUser, Reaction } from "@/lib/types";
import { useRequireAuth } from "@/lib/use-require-auth";

/** Find members and posts. A leading # searches that tag instead. */
export default function SearchPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ q: string; members: PublicUser[]; posts: Post[] } | null>(
    null,
  );

  const q = query.trim();

  useEffect(() => {
    if (q.length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const tag = /^#(\w{2,50})$/.exec(q)?.[1];
        const [members, posts] = await Promise.all([
          tag ? Promise.resolve([]) : api.searchUsers(q),
          tag ? api.getTagPosts(tag).then((r) => r.items) : api.searchPosts(q),
        ]);
        if (!cancelled) setResults({ q, members, posts });
      } catch {
        // keep the previous results
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q]);

  async function react(post: Post, next: Reaction | null) {
    const update = (fn: (p: Post) => Post) =>
      setResults((r) => r && { ...r, posts: r.posts.map((p) => (p.id === post.id ? fn(p) : p)) });
    update((p) => applyReaction(p, next));
    if (!(await saveReaction(post, next))) update(() => post);
  }

  if (authLoading || !user) return null;

  const shown = q.length >= 2 && results?.q === q ? results : null;

  return (
    <AppShell>
      <div className="space-y-4">
        <label className="flex items-center gap-2 rounded-xl border border-black/10 bg-white/60 px-3.5 py-2.5 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 dark:border-white/10 dark:bg-white/5">
          <Search className="h-4 w-4 text-foreground/40" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members, posts or #tags"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-foreground/35"
          />
        </label>

        {shown && shown.members.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground/70">Members</h2>
            <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl border border-black/5 bg-white/60 dark:divide-white/10 dark:border-white/10 dark:bg-white/5">
              {shown.members.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/profile/${m.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <Avatar name={m.fullName} src={m.avatarUrl} size={36} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{m.fullName}</span>
                      <span className="block truncate text-xs text-foreground/50">@{m.username}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {shown && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground/70">Posts</h2>
            {shown.posts.length === 0 ? (
              <p className="text-sm text-foreground/50">No posts match “{shown.q}”.</p>
            ) : (
              <div className="space-y-3">
                {shown.posts.map((post) => (
                  <PostCard key={post.id} post={post} onReact={react} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}
