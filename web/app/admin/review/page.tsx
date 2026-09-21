"use client";

import { Inbox, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ReviewPostCard } from "@/components/admin/review-post-card";
import { ErrorBanner } from "@/components/ui/error-banner";
import { api } from "@/lib/api-client";
import type { Post } from "@/lib/types";
import { useRequireAuth } from "@/lib/use-require-auth";

export default function AdminReviewPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPosts(await api.getPendingPosts());
    } catch {
      setError("Couldn't load the review queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      router.replace("/feed");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user?.role === "admin") load();
  }, [user, load]);

  async function handleApprove(post: Post) {
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    try {
      await api.approvePost(post.id);
    } catch {
      setError("Couldn't approve that post.");
      load();
    }
  }

  async function handleReject(post: Post) {
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    try {
      await api.rejectPost(post.id);
    } catch {
      setError("Couldn't reject that post.");
      load();
    }
  }

  if (authLoading || !user || user.role !== "admin") return null;

  return (
    <AppShell>
      <div>
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand" />
          <h1 className="text-lg font-semibold">Review queue</h1>
          {posts.length > 0 && (
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
              {posts.length} pending
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} />
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-black/5 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-black/10 dark:bg-white/10" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-3.5 w-32 rounded bg-black/10 dark:bg-white/10" />
                    <div className="h-3 w-full rounded bg-black/10 dark:bg-white/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/10 py-16 text-center dark:border-white/10">
            <Inbox className="h-8 w-8 text-foreground/25" />
            <p className="text-sm text-foreground/50">
              Nothing waiting for review right now.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <ReviewPostCard
                key={post.id}
                post={post}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
