"use client";

import { Check, Heart, MessageCircle, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Lightbox } from "@/components/ui/lightbox";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRelativeTime } from "@/lib/format";
import type { Post } from "@/lib/types";

const TRUNCATE_AT = 260;

function resolveMediaUrl(url: string): string {
  return url.startsWith("http")
    ? url
    : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"}${url}`;
}

export function PostCard({
  post,
  onToggleLike,
  onDelete,
  onEdit,
  clickable = true,
}: {
  post: Post;
  onToggleLike: (post: Post) => void;
  onDelete?: (post: Post) => void;
  onEdit?: (post: Post, newContent: string) => Promise<void>;
  clickable?: boolean;
}) {
  const router = useRouter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [justLiked, setJustLiked] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);
  const [savingEdit, setSavingEdit] = useState(false);

  const resolvedMedia = post.mediaUrls.map(resolveMediaUrl);
  const visibleMedia = resolvedMedia.filter((url) => !brokenImages.has(url));

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

  async function handleSaveEdit() {
    if (!onEdit || !editText.trim()) return;
    setSavingEdit(true);
    try {
      await onEdit(post, editText.trim());
      setEditing(false);
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div
      onClick={clickable && !editing ? () => router.push(`/post/${post.id}`) : undefined}
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

          {editing ? (
            <div className="mt-1.5 space-y-2" onClick={(e) => e.stopPropagation()}>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                maxLength={5000}
                autoFocus
                className="w-full resize-none rounded-lg border border-black/10 bg-transparent px-3 py-2 text-[15px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/10"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={savingEdit || !editText.trim()}
                  className="flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground disabled:opacity-60"
                >
                  <Check className="h-3.5 w-3.5" />
                  {savingEdit ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditText(post.content);
                    setEditing(false);
                  }}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-foreground/60 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
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
          )}

          {visibleMedia.length > 0 && (
            <div
              className={`mt-3 grid gap-1.5 overflow-hidden rounded-xl ${
                visibleMedia.length === 1 ? "grid-cols-1" : "grid-cols-2"
              }`}
            >
              {visibleMedia.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url}
                  alt=""
                  loading="lazy"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(i);
                  }}
                  onError={() =>
                    setBrokenImages((prev) => new Set(prev).add(url))
                  }
                  className={`w-full cursor-zoom-in object-cover transition-transform duration-300 hover:scale-[1.02] ${
                    visibleMedia.length === 1 ? "max-h-[420px]" : "aspect-square"
                  }`}
                />
              ))}
            </div>
          )}

          {lightboxIndex !== null && (
            <Lightbox
              images={visibleMedia}
              startIndex={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
            />
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

            {!editing && (onEdit || onDelete) && post.isOwner && (
              <div className="ml-auto flex items-center gap-1.5">
                {onEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditText(post.content);
                      setEditing(true);
                    }}
                    aria-label="Edit post"
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-foreground/40 transition-colors hover:bg-black/5 hover:text-foreground/70 md:opacity-0 md:group-hover:opacity-100 dark:hover:bg-white/10"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                {onDelete && (
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
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      confirmingDelete
                        ? "bg-red-500/10 text-red-500"
                        : "text-foreground/40 hover:bg-red-500/10 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100"
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                    {confirmingDelete && "Confirm delete?"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
