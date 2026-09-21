"use client";

import { ArrowLeft, Loader2, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PostCard } from "@/components/posts/post-card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { api, ApiError } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/format";
import type { Comment, Post } from "@/lib/types";
import { useRequireAuth } from "@/lib/use-require-auth";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useRequireAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

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

  async function toggleLike(target: Post) {
    const liked = target.likedByMe;
    setPost((p) =>
      p ? { ...p, likedByMe: !liked, likeCount: p.likeCount + (liked ? -1 : 1) } : p,
    );
    try {
      if (liked) await api.unlike(target.id);
      else await api.like(target.id);
    } catch {
      setPost((p) =>
        p ? { ...p, likedByMe: liked, likeCount: p.likeCount + (liked ? 1 : -1) } : p,
      );
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !post) return;

    setSubmittingComment(true);
    try {
      const comment = await api.createComment(post.id, commentText.trim());
      setComments((prev) => [...prev, comment]);
      setPost((p) => (p ? { ...p, commentCount: p.commentCount + 1 } : p));
      setCommentText("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't post that comment.");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setPost((p) => (p ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p));
    try {
      await api.deleteComment(commentId);
    } catch {
      setError("Couldn't delete that comment.");
    }
  }

  if (authLoading || !user) return null;

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
            <PostCard post={post} onToggleLike={toggleLike} clickable={false} />

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground/70">
                Comments {comments.length > 0 && `(${comments.length})`}
              </h2>

              {comments.length === 0 ? (
                <p className="text-sm text-foreground/40">
                  No comments yet — be the first to reply.
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3">
                    <Link href={`/profile/${comment.authorId}`} className="shrink-0">
                      <Avatar
                        name={comment.authorName}
                        src={comment.authorAvatarUrl}
                        size={32}
                      />
                    </Link>
                    <div className="flex-1 rounded-xl bg-black/5 px-3.5 py-2.5 dark:bg-white/5">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/profile/${comment.authorId}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {comment.authorName}
                        </Link>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-foreground/40">
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                          {comment.isOwner && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-foreground/30 hover:text-red-500"
                              aria-label="Delete comment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}

              <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment…"
                  maxLength={1000}
                  className="flex-1 rounded-xl border border-black/10 bg-transparent px-3.5 py-2.5 text-sm outline-none placeholder:text-foreground/35 focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/10"
                />
                <Button
                  type="submit"
                  loading={submittingComment}
                  disabled={!commentText.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
