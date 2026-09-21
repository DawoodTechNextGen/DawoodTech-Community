"use client";

import { Heart, MessageCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRelativeTime } from "@/lib/format";
import type { Post } from "@/lib/types";

const TRUNCATE_AT = 260;

export function PostCard({
  post,
  onToggleLike,
  onDelete,
  clickable = true,
}: {
  post: Post;
  onToggleLike: (post: Post) => void;
  onDelete?: (post: Post) => void;
  clickable?: boolean;
}) {
  const router = useRouter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [justLiked, setJustLiked] = useState(false);

  const isLong = post.content.length > TRUNCATE_AT;
  const displayContent =
    isLong && !expanded ? post.content.slice(0, TRUNCATE_AT).trimEnd() + "…" : post.content;

  function handleLikeClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!post.likedByMe) {
      setJustLiked(true);
      setTimeout(() => setJustLiked(false), 400);
    }
    onToggleLike(post);
  }

  return (
    <div
      onClick={clickable ? () => router.push(`/post/${post.id}`) : undefined}
      className={`group rounded-2xl border border-black/5 bg-white/60 p-5 shadow-sm transition-all duration-200 dark:border-white/10 dark:bg-white/5 ${
        clickable
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-lg hover:shadow-black/5"
          : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <Link
          href={`/profile/${post.authorId}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 transition-transform hover:scale-105"
        >
          <Avatar name={post.authorName} src={post.authorAvatarUrl} size={44} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/profile/${post.authorId}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold hover:underline"
            >
              {post.authorName}
            </Link>
            <span className="text-xs text-foreground/40">
              {formatRelativeTime(post.createdAt)}
            </span>
            {post.status !== "approved" && <StatusBadge status={post.status} />}
          </div>

          <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
            {displayContent}
            {isLong && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((v) => !v);
                }}
                className="ml-1.5 text-sm font-medium text-brand hover:underline"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </p>

          {post.mediaUrls.length > 0 && (
            <div
              className={`mt-3 grid gap-1.5 overflow-hidden rounded-xl ${
                post.mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"
              }`}
            >
              {post.mediaUrls.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={
                    url.startsWith("http")
                      ? url
                      : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"}${url}`
                  }
                  alt=""
                  className={`w-full object-cover transition-transform duration-300 hover:scale-[1.02] ${
                    post.mediaUrls.length === 1 ? "max-h-[420px]" : "aspect-square"
                  }`}
                />
              ))}
            </div>
          )}

          <div className="mt-3.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleLikeClick}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors ${
                post.likedByMe
                  ? "text-rose-500"
                  : "text-foreground/50 hover:bg-rose-500/10 hover:text-rose-500"
              }`}
            >
              <Heart
                className={`h-4 w-4 ${post.likedByMe ? "fill-current" : ""} ${justLiked ? "heart-pop" : ""}`}
              />
              {post.likeCount > 0 && post.likeCount}
            </button>

            <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium text-foreground/50">
              <MessageCircle className="h-4 w-4" />
              {post.commentCount > 0 && post.commentCount}
            </span>

            {onDelete && post.isOwner && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirmingDelete) {
                    onDelete(post);
                  } else {
                    setConfirmingDelete(true);
                    setTimeout(() => setConfirmingDelete(false), 3000);
                  }
                }}
                className={`ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  confirmingDelete
                    ? "bg-red-500/10 text-red-500"
                    : "text-foreground/30 opacity-0 hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                }`}
              >
                <Trash2 className="h-4 w-4" />
                {confirmingDelete && "Confirm delete?"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
