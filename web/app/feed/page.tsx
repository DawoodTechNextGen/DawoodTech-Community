"use client";

import { Compass, Users2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { LeaderboardCard } from "@/components/community/leaderboard-card";
import { TrendingTags } from "@/components/community/trending-tags";
import { AboutCard } from "@/components/layout/about-card";
import { AppShell } from "@/components/layout/app-shell";
import { SuggestedMembers } from "@/components/layout/suggested-members";
import { SuggestedMembersCarousel } from "@/components/layout/suggested-members-carousel";
import { PushBanner } from "@/components/notifications/push-prompt";
import { WelcomeChecklist } from "@/components/onboarding/welcome-checklist";
import { DailyPromptCard } from "@/components/prompts/daily-prompt-card";
import { CreatePostComposer } from "@/components/posts/create-post-composer";
import { PostCard } from "@/components/posts/post-card";
import { PostCardSkeleton } from "@/components/posts/post-card-skeleton";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { api } from "@/lib/api-client";
import { applyReaction, saveReaction } from "@/lib/reactions";
import type { Post, Reaction } from "@/lib/types";
import { useRequireAuth } from "@/lib/use-require-auth";

type Tab = "feed" | "explore" | "questions";

const TAB_LABELS: Record<Tab, string> = {
  feed: "For You",
  explore: "Explore",
  questions: "Questions",
};

const fetchTab = (tab: Tab, cursor?: string) =>
  tab === "feed"
    ? api.getFeed(cursor)
    : tab === "explore"
      ? api.getExplore(cursor)
      : api.getQuestions(cursor);

export default function FeedPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const [tab, setTab] = useState<Tab>("feed");
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressKey, setProgressKey] = useState(0);
  const [pinned, setPinned] = useState<Post[]>([]);
  const isAdmin = user?.role === "admin";

  const load = useCallback(async (activeTab: Tab) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTab(activeTab);
      setPosts(res.items);
      setCursor(res.nextCursor);
    } catch {
      setError("Couldn't load the feed. Pull to refresh or try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load(tab);
  }, [user, tab, load]);

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const res = await fetchTab(tab, cursor);
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


  const loadPinned = useCallback(() => {
    api
      .getPinnedPosts()
      .then(setPinned)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) loadPinned();
  }, [user, loadPinned]);

  async function togglePin(post: Post) {
    try {
      if (post.pinned) {
        await api.pinPost(post.id, false);
      } else {
        const notifyAll = window.confirm(
          "Pin this to the top of everyone's feed.\n\nAlso send every member an announcement notification?",
        );
        await api.pinPost(post.id, true, notifyAll);
      }
      loadPinned();
      load(tab);
    } catch {
      setError("Couldn't change the pin.");
    }
  }

  async function reactPinned(post: Post, next: Reaction | null) {
    setPinned((prev) => prev.map((p) => (p.id === post.id ? applyReaction(p, next) : p)));
    if (!(await saveReaction(post, next))) loadPinned();
  }

  async function handleDelete(post: Post) {
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    try {
      await api.deletePost(post.id);
    } catch {
      setError("Couldn't delete that post.");
      load(tab);
    }
  }

  async function handleEdit(post: Post, newContent: string) {
    try {
      const updated = await api.updatePost(post.id, {
        content: newContent,
        mediaUrls: post.mediaUrls,
      });
      setPosts((prev) => prev.map((p) => (p.id === post.id ? updated : p)));
    } catch {
      setError("Couldn't save that edit.");
    }
  }

  if (authLoading || !user) return null;

  return (
    <AppShell
      rightRail={
        <>
          <AboutCard />
          <LeaderboardCard />
          <TrendingTags />
          <SuggestedMembers />
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex gap-1 rounded-xl bg-black/5 p-1 dark:bg-white/5">
          {(["feed", "explore", "questions"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-white text-foreground shadow-sm dark:bg-white/10"
                  : "text-foreground/50 hover:text-foreground/80"
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {pinned.map((post) => (
          <PostCard
            key={`pinned-${post.id}`}
            post={post}
            onReact={reactPinned}
            onTogglePin={isAdmin ? togglePin : undefined}
          />
        ))}

        <WelcomeChecklist refreshKey={progressKey} onFindPeople={() => setTab("explore")} />
        <DailyPromptCard
          refreshKey={progressKey}
          onAnswered={() => {
            load(tab);
            setProgressKey((k) => k + 1);
          }}
        />
        <PushBanner />
        <CreatePostComposer
          onSubmitted={() => {
            load(tab);
            setProgressKey((k) => k + 1);
          }}
        />

        <div className="lg:hidden">
          <SuggestedMembersCarousel />
        </div>

        {error && <ErrorBanner message={error} />}

        {loading ? (
          <div className="space-y-3">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/10 py-16 text-center dark:border-white/10">
            {tab === "feed" ? (
              <Users2 className="h-8 w-8 text-foreground/25" />
            ) : (
              <Compass className="h-8 w-8 text-foreground/25" />
            )}
            <p className="max-w-xs text-sm text-foreground/50">
              {tab === "feed"
                ? "No posts yet from people you follow. Try Explore to discover the community."
                : tab === "questions"
                  ? "No questions yet. Stuck on something? Tap “Ask” in the box above."
                  : "No approved posts yet — be the first to share a success story."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onReact={react}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onTogglePin={isAdmin ? togglePin : undefined}
              />
            ))}
          </div>
        )}

        {cursor && !loading && (
          <div className="flex justify-center pt-2">
            <Button variant="ghost" loading={loadingMore} onClick={loadMore}>
              Load more
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
