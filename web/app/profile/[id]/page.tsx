"use client";

import { FileText } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { FollowListModal } from "@/components/profile/follow-list-modal";
import { ProfileHeader } from "@/components/profile/profile-header";
import { PostCard } from "@/components/posts/post-card";
import { PostCardSkeleton } from "@/components/posts/post-card-skeleton";
import { ErrorBanner } from "@/components/ui/error-banner";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { Post, PublicUser } from "@/lib/types";
import { useRequireAuth } from "@/lib/use-require-auth";

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, isLoading: authLoading } = useRequireAuth();
  const { updateUser } = useAuth();

  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followListType, setFollowListType] = useState<"followers" | "following" | null>(
    null,
  );

  const isOwnProfile = currentUser?.id === id;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, postsRes, followers, following] = await Promise.all([
        api.getUser(id),
        api.getUserPosts(id),
        api.getFollowers(id),
        api.getFollowing(id),
      ]);
      setProfile(profileRes);
      setPosts(postsRes);
      setFollowerCount(followers.length);
      setFollowingCount(following.length);

      if (currentUser && currentUser.id !== id) {
        const status = await api.getFollowStatus(id);
        setIsFollowing(status.isFollowing);
      }
    } catch {
      setError("Couldn't load this profile.");
    } finally {
      setLoading(false);
    }
  }, [id, currentUser]);

  useEffect(() => {
    if (currentUser) load();
  }, [currentUser, load]);

  async function handleFollowToggle() {
    if (!profile) return;
    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);
    setFollowerCount((c) => c + (nextFollowing ? 1 : -1));
    try {
      if (nextFollowing) await api.followUser(profile.id);
      else await api.unfollowUser(profile.id);
    } catch {
      setIsFollowing(!nextFollowing);
      setFollowerCount((c) => c + (nextFollowing ? -1 : 1));
      setError("Couldn't update follow status.");
    }
  }

  function handleProfileUpdated(updated: PublicUser) {
    setProfile(updated);
    if (isOwnProfile) updateUser(updated);
  }

  async function toggleLike(post: Post) {
    const liked = post.likedByMe;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likedByMe: !liked, likeCount: p.likeCount + (liked ? -1 : 1) }
          : p,
      ),
    );
    try {
      if (liked) await api.unlike(post.id);
      else await api.like(post.id);
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, likedByMe: liked, likeCount: p.likeCount + (liked ? 1 : -1) }
            : p,
        ),
      );
    }
  }

  async function handleDelete(post: Post) {
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    try {
      await api.deletePost(post.id);
    } catch {
      setError("Couldn't delete that post.");
      load();
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

  if (authLoading || !currentUser) return null;

  return (
    <AppShell>
      <div className="space-y-4">
        {error && <ErrorBanner message={error} />}

        {loading ? (
          <div className="animate-pulse rounded-2xl border border-black/5 bg-white/60 p-6 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 shrink-0 rounded-full bg-black/10 dark:bg-white/10" />
              <div className="flex-1 space-y-3 pt-1">
                <div className="h-4 w-40 rounded bg-black/10 dark:bg-white/10" />
                <div className="h-3 w-24 rounded bg-black/10 dark:bg-white/10" />
                <div className="h-3 w-full max-w-xs rounded bg-black/10 dark:bg-white/10" />
              </div>
            </div>
          </div>
        ) : (
          profile && (
            <ProfileHeader
              profile={profile}
              isOwnProfile={isOwnProfile}
              followerCount={followerCount}
              followingCount={followingCount}
              isFollowing={isFollowing}
              onFollowToggle={handleFollowToggle}
              onProfileUpdated={handleProfileUpdated}
              onShowFollowers={() => setFollowListType("followers")}
              onShowFollowing={() => setFollowListType("following")}
            />
          )
        )}

        <div className="space-y-3">
          {loading ? (
            <>
              <PostCardSkeleton />
              <PostCardSkeleton />
            </>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/10 py-12 text-center dark:border-white/10">
              <FileText className="h-8 w-8 text-foreground/25" />
              <p className="text-sm text-foreground/50">
                {isOwnProfile
                  ? "You haven't shared anything yet."
                  : "No posts to show yet."}
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onToggleLike={toggleLike}
                onDelete={isOwnProfile ? handleDelete : undefined}
                onEdit={isOwnProfile ? handleEdit : undefined}
              />
            ))
          )}
        </div>
      </div>

      {followListType && (
        <FollowListModal
          userId={id}
          type={followListType}
          onClose={() => {
            setFollowListType(null);
            load();
          }}
        />
      )}
    </AppShell>
  );
}
