"use client";

import {
  ArrowLeft,
  BadgeCheck,
  CornerDownRight,
  Loader2,
  Send,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PostCard } from "@/components/posts/post-card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { MentionMenu } from "@/components/ui/mention-menu";
import { RichText } from "@/components/ui/rich-text";
import { api, ApiError } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/format";
import { applyReaction, saveReaction } from "@/lib/reactions";
import type { Comment, Post, Reaction } from "@/lib/types";
import { useMentions } from "@/lib/use-mentions";
import { useRequireAuth } from "@/lib/use-require-auth";

function groupComments(comments: Comment[]): Map<string, Comment[]> {
  const byId = new Map(comments.map((c) => [c.id, c]));
  function rootIdOf(comment: Comment): string {
    let current = comment;
    while (current.parentId) {
      const parent = byId.get(current.parentId);
      if (!parent) break;
      current = parent;
    }
    return current.id;
  }
  const replies = new Map<string, Comment[]>();
  for (const c of comments) {
    if (!c.parentId) continue;
    const rootId = rootIdOf(c);
    if (!replies.has(rootId)) replies.set(rootId, []);
    replies.get(rootId)!.push(c);
  }
  return replies;
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useRequireAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const commentMentions = useMentions(commentInputRef, commentText, setCommentText);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [postRes, commentsRes] = await Promise.all([
          api.getPost(id),
          api.getComments(id),
        ]);
        if (!cancelled) {
          setPost(postRes);
          setComments(commentsRes);
        }
      } catch {
        if (!cancelled) setError("Couldn't load this post.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  async function react(target: Post, next: Reaction | null) {
    setPost((p) => (p ? applyReaction(p, next) : p));
    if (!(await saveReaction(target, next))) setPost(target);
  }


  async function handleEdit(target: Post, newContent: string) {
    try {
      const updated = await api.updatePost(target.id, {
        content: newContent,
        mediaUrls: target.mediaUrls,
      });
      setPost(updated);
    } catch {
      setError("Couldn't save that edit.");
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !post) return;

    setSubmittingComment(true);
    try {
      const comment = await api.createComment(
        post.id,
        commentText.trim(),
        replyTo?.id,
      );
      setComments((prev) => [...prev, comment]);
      setPost((p) => (p ? { ...p, commentCount: p.commentCount + 1 } : p));
      setCommentText("");
      setReplyTo(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't post that comment.");
    } finally {
      setSubmittingComment(false);
    }
  }

  function startReply(comment: Comment) {
    setReplyTo(comment);
    commentInputRef.current?.focus();
  }

  /** The asker accepts an answer (accepting it again un-accepts it). */
  async function handleAccept(comment: Comment) {
    try {
      const updated = await api.acceptAnswer(comment.id);
      setComments((prev) =>
        prev.map((c) => ({ ...c, accepted: c.id === updated.id ? updated.accepted : false })),
      );
      setPost((p) => (p ? { ...p, answered: updated.accepted } : p));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't accept that answer.");
    }
  }

  async function handleDeleteComment(commentId: string) {
    setComments((prev) => {
      const toRemove = new Set([commentId]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const c of prev) {
          if (c.parentId && toRemove.has(c.parentId) && !toRemove.has(c.id)) {
            toRemove.add(c.id);
            grew = true;
          }
        }
      }
      setPost((p) =>
        p ? { ...p, commentCount: Math.max(0, p.commentCount - toRemove.size) } : p,
      );
      return prev.filter((c) => !toRemove.has(c.id));
    });
    try {
      await api.deleteComment(commentId);
    } catch {
      setError("Couldn't delete that comment.");
    }
  }

  const repliesByRoot = groupComments(comments);

  if (authLoading || !user) return null;

  const canModerateComments = user.role === "admin" || !!post?.isOwner;

  return (
    <AppShell>
      <div className="space-y-4">
        <Link
          href="/feed"
          className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to feed
        </Link>

        {error && <ErrorBanner message={error} />}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : !post ? (
          <div className="py-16 text-center text-sm text-foreground/50">
            This post isn't available.
          </div>
        ) : (
          <>
            <PostCard
              post={post}
              onReact={react}
              onEdit={post.isOwner ? handleEdit : undefined}
              clickable={false}
            />

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground/70">
                Comments {comments.length > 0 && `(${comments.length})`}
              </h2>

              {comments.length === 0 ? (
                <p className="text-sm text-foreground/40">
                  No comments yet — be the first to reply.
                </p>
              ) : (
                comments
                  .filter((c) => !c.parentId)
                  // The accepted answer leads.
                  .sort((a, b) => Number(b.accepted) - Number(a.accepted))
                  .map((comment) => {
                    const replies = repliesByRoot.get(comment.id) ?? [];
                    return (
                      <div key={comment.id} className="space-y-2.5">
                        <CommentRow
                          comment={comment}
                          onReply={startReply}
                          onDelete={handleDeleteComment}
                          canModerate={canModerateComments}
                          onAccept={
                            post?.isQuestion && post.isOwner && !comment.isOwner
                              ? handleAccept
                              : undefined
                          }
                        />
                        {replies.length > 0 && (
                          <div className="ml-10 space-y-2.5 border-l-2 border-black/5 pl-3.5 dark:border-white/10">
                            {replies.map((reply) => (
                              <CommentRow
                                key={reply.id}
                                comment={reply}
                                onReply={startReply}
                                onDelete={handleDeleteComment}
                                canModerate={canModerateComments}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}

              <form onSubmit={handleAddComment} className="space-y-2 pt-2">
                {replyTo && (
                  <div className="flex items-center gap-2 rounded-lg bg-brand/10 px-3 py-1.5 text-xs text-brand">
                    <CornerDownRight className="h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">
                      Replying to <span className="font-semibold">{replyTo.authorName}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setReplyTo(null)}
                      aria-label="Cancel reply"
                      className="shrink-0 hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={commentInputRef}
                      value={commentText}
                      onChange={commentMentions.onChange}
                      onKeyDown={commentMentions.onKeyDown}
                      placeholder={replyTo ? `Reply to ${replyTo.authorName}…` : "Write a comment…"}
                      maxLength={1000}
                      className="w-full rounded-xl border border-black/10 bg-transparent px-3.5 py-2.5 text-sm outline-none placeholder:text-foreground/35 focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/10"
                    />
                    <MentionMenu {...commentMentions.menu} />
                  </div>
                  <Button
                    type="submit"
                    loading={submittingComment}
                    disabled={!commentText.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function CommentRow({
  comment,
  onReply,
  onDelete,
  canModerate,
  onAccept,
}: {
  comment: Comment;
  onReply: (comment: Comment) => void;
  onDelete: (id: string) => void;
  /** The post's author or an admin, who may remove anyone's comment. */
  canModerate: boolean;
  /** Set when the viewer asked the question and may accept this answer. */
  onAccept?: (comment: Comment) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <Link href={`/profile/${comment.authorId}`} className="shrink-0">
        <Avatar name={comment.authorName} src={comment.authorAvatarUrl} size={32} />
      </Link>
      <div className="min-w-0 flex-1">
        <div
          className={`rounded-xl px-3.5 py-2.5 ${
            comment.accepted
              ? "border border-emerald-500/30 bg-emerald-500/10"
              : "bg-black/5 dark:bg-white/5"
          }`}
        >
          {comment.accepted && (
            <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <BadgeCheck className="h-3.5 w-3.5" />
              Accepted answer
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/profile/${comment.authorId}`}
              className="text-sm font-medium hover:underline"
            >
              {comment.authorName}
            </Link>
            {(comment.isOwner || canModerate) && (
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                className="text-foreground/30 hover:text-red-500"
                aria-label="Delete comment"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="mt-0.5 whitespace-pre-wrap text-sm">
            <RichText text={comment.content} />
          </p>
        </div>
        <div className="mt-1 flex items-center gap-3 px-1">
          <span className="text-xs text-foreground/40">
            {formatRelativeTime(comment.createdAt)}
          </span>
          <button
            type="button"
            onClick={() => onReply(comment)}
            className="text-xs font-medium text-foreground/50 hover:text-brand"
          >
            Reply
          </button>
          {onAccept && (
            <button
              type="button"
              onClick={() => onAccept(comment)}
              className="text-xs font-medium text-foreground/50 hover:text-emerald-600"
            >
              {comment.accepted ? "Unaccept" : "Accept answer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
