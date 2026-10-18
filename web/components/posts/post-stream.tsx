"use client";

import { useEffect, useState } from "react";
import { PostCard } from "@/components/posts/post-card";
import { PostCardSkeleton } from "@/components/posts/post-card-skeleton";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { applyReaction, saveReaction } from "@/lib/reactions";
import type { PaginatedPosts, Post, Reaction } from "@/lib/types";

/** A paginated, reactable list of posts from any cursor endpoint. */
export function PostStream({
  fetchPage,
  emptyText,
}: {
  fetchPage: (cursor?: string) => Promise<PaginatedPosts>;
  emptyText: string;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPage()
      .then((res) => {
        if (cancelled) return;
        setPosts(res.items);
        setCursor(res.nextCursor);
      })
      .catch(() => !cancelled && setError("Couldn't load posts."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const res = await fetchPage(cursor);
      setPosts((prev) => [...prev, ...res.items]);
      setCursor(res.nextCursor);
    } catch {
      setError("Couldn't load more posts.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function react(post: Post, next: Reaction | null) {
    setPosts((prev) => prev.map((p) => (p.id === post.id ? applyReaction(p, next) : p)));
    if (!(await saveReaction(post, next))) {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)));
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <PostCardSkeleton />
        <PostCardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <ErrorBanner message={error} />}
      {posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/10 py-12 text-center text-sm text-foreground/50 dark:border-white/10">
          {emptyText}
        </p>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} onReact={react} />)
      )}
      {cursor && (
        <div className="flex justify-center pt-2">
          <Button variant="ghost" loading={loadingMore} onClick={loadMore}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
