"use client";

import {
  BadgeCheck,
  Check,
  Heart,
  HelpCircle,
  MessageCircle,
  MessageCircleQuestion,
  SmilePlus,
  PartyPopper,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { RichText } from "@/components/ui/rich-text";
import { Lightbox } from "@/components/ui/lightbox";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatRelativeTime } from "@/lib/format";
import { REACTIONS, reactionEmoji } from "@/lib/reactions";
import type { Post, Reaction } from "@/lib/types";

const TRUNCATE_AT = 260;

function resolveMediaUrl(url: string): string {
  return url.startsWith("http")
    ? url
    : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"}${url}`;
}

export function PostCard({
  post,
  onReact,
  onDelete,
  onEdit,
  onTogglePin,
  clickable = true,
}: {
  post: Post;
  /** The viewer's new reaction, or null to remove it. */
  onReact: (post: Post, reaction: Reaction | null) => void;
  onDelete?: (post: Post) => void;
  onEdit?: (post: Post, newContent: string) => Promise<void>;
  /** Admins only: pin to / unpin from the top of the feed. */
  onTogglePin?: (post: Post) => void;
  clickable?: boolean;
}) {
  const router = useRouter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [justLiked, setJustLiked] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
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

  /** The heart toggles your reaction: off if you have one, else a like. */
  function handleLikeClick(e: React.MouseEvent) {
    e.stopPropagation();
    react(post.myReaction ? null : "like");
  }

  function react(next: Reaction | null) {
    setPickerOpen(false);
    if (next) {
      setJustLiked(true);
      setTimeout(() => setJustLiked(false), 400);
    }
    onReact(post, next);
  }

  // Most-used reactions first, for the little emoji summary.
  const topReactions = REACTIONS.filter((r) => (post.reactions[r.key] ?? 0) > 0)
    .sort((a, b) => (post.reactions[b.key] ?? 0) - (post.reactions[a.key] ?? 0))
    .slice(0, 3);

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
            {post.isQuestion && (
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  post.answered
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                }`}
              >
                {post.answered ? <BadgeCheck className="h-3 w-3" /> : <HelpCircle className="h-3 w-3" />}
                {post.answered ? "Answered" : "Question"}
              </span>
            )}
            {post.pinned && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                <Pin className="h-3 w-3" />
                Pinned
              </span>
            )}
            {onTogglePin && post.status === "approved" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(post);
                }}
                className="ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-foreground/50 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
              >
                {post.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                {post.pinned ? "Unpin" : "Pin"}
              </button>
            )}
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
            <>
              {post.milestone && (
                <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <PartyPopper className="h-3.5 w-3.5" />
                  {post.milestone === "internship_completed" ? "Internship completed" : "New member"}
                </p>
              )}
              {post.prompt && (
                <p className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-brand/5 px-2.5 py-1.5 text-xs font-medium text-brand">
                  <MessageCircleQuestion className="mt-px h-3.5 w-3.5 shrink-0" />
                  {post.prompt}
                </p>
              )}
              <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
                <RichText text={displayContent} />
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
            </>
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
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={handleLikeClick}
                aria-label={post.myReaction ? "Remove your reaction" : "Like"}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors ${
                  post.myReaction
                    ? "text-rose-500"
                    : "text-foreground/50 hover:bg-rose-500/10 hover:text-rose-500"
                }`}
              >
                {post.myReaction && post.myReaction !== "like" ? (
                  <span className={`text-base leading-none ${justLiked ? "heart-pop" : ""}`}>
                    {reactionEmoji(post.myReaction)}
                  </span>
                ) : (
                  <Heart
                    className={`h-4 w-4 ${post.myReaction ? "fill-current" : ""} ${justLiked ? "heart-pop" : ""}`}
                  />
                )}
                {topReactions.length > 1 && (
                  <span className="text-xs leading-none">
                    {topReactions.map((r) => r.emoji).join("")}
                  </span>
                )}
                {post.likeCount > 0 && post.likeCount}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPickerOpen((open) => !open);
                }}
                aria-label="Choose a reaction"
                aria-expanded={pickerOpen}
                className="rounded-full p-1.5 text-foreground/40 transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
              >
                <SmilePlus className="h-4 w-4" />
              </button>
              {pickerOpen && (
                <div
                  role="menu"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-full left-0 z-20 mb-1 flex gap-0.5 rounded-full border border-black/10 bg-background p-1 shadow-lg dark:border-white/10"
                >
                  {REACTIONS.map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      role="menuitem"
                      title={r.label}
                      aria-label={r.label}
                      onClick={() => react(post.myReaction === r.key ? null : r.key)}
                      className={`rounded-full px-1.5 py-1 text-lg leading-none transition-transform hover:scale-125 ${
                        post.myReaction === r.key ? "bg-brand/15" : ""
                      }`}
                    >
                      {r.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
