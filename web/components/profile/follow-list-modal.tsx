"use client";

import { Loader2, UserMinus, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "@/components/ui/avatar";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { PublicUser } from "@/lib/types";

export function FollowListModal({
  userId,
  type,
  onClose,
}: {
  userId: string;
  type: "followers" | "following";
  onClose: () => void;
}) {
  const { user: currentUser } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [members, setMembers] = useState<PublicUser[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const list = type === "followers" ? await api.getFollowers(userId) : await api.getFollowing(userId);
        const myFollowing =
          type === "following" && userId === currentUser!.id
            ? list
            : await api.getFollowing(currentUser!.id);
        if (!cancelled) {
          setMembers(list);
          setFollowingIds(new Set(myFollowing.map((m) => m.id)));
        }
      } catch {
        if (!cancelled) setMembers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId, type, currentUser]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  async function toggleFollow(member: PublicUser) {
    const isFollowing = followingIds.has(member.id);
    setBusyId(member.id);
    try {
      if (isFollowing) {
        await api.unfollowUser(member.id);
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(member.id);
          return next;
        });
      } else {
        await api.followUser(member.id);
        setFollowingIds((prev) => new Set(prev).add(member.id));
      }
    } catch {
      // leave state as-is; the button will just reflect the last known state
    } finally {
      setBusyId(null);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-background shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-3.5 dark:border-white/10">
          <h2 className="text-sm font-semibold capitalize">{type}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-foreground/50 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-brand" />
            </div>
          ) : members.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-foreground/45">
              {type === "followers" ? "No followers yet." : "Not following anyone yet."}
            </p>
          ) : (
            <ul className="divide-y divide-black/5 dark:divide-white/10">
              {members.map((member) => {
                const isSelf = member.id === currentUser?.id;
                const isFollowing = followingIds.has(member.id);
                return (
                  <li key={member.id} className="flex items-center gap-3 px-5 py-3">
                    <Link href={`/profile/${member.id}`} onClick={onClose} className="shrink-0">
                      <Avatar name={member.fullName} src={member.avatarUrl} size={40} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/profile/${member.id}`}
                        onClick={onClose}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {member.fullName}
                      </Link>
                      <p className="truncate text-xs text-foreground/45">@{member.username}</p>
                    </div>
                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => toggleFollow(member)}
                        disabled={busyId === member.id}
                        className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                          isFollowing
                            ? "text-foreground/60 hover:bg-black/5 dark:hover:bg-white/10"
                            : "bg-brand/10 text-brand hover:bg-brand/20"
                        }`}
                      >
                        {busyId === member.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isFollowing ? (
                          <>
                            <UserMinus className="h-3.5 w-3.5" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3.5 w-3.5" />
                            Follow
                          </>
                        )}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
