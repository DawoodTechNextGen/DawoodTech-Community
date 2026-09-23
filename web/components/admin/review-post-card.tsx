"use client";

import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/format";
import type { Post } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export function ReviewPostCard({
  post,
  onApprove,
  onReject,
}: {
  post: Post;
  onApprove: (post: Post, notifyInterns: boolean) => Promise<void>;
  onReject: (post: Post) => Promise<void>;
}) {
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);
  const [notifyInterns, setNotifyInterns] = useState(true);

  async function handle(action: "approve" | "reject") {
    setPending(action);
    try {
      await (action === "approve" ? onApprove(post, notifyInterns) : onReject(post));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white/60 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start gap-3">
        <Avatar name={post.authorName} src={post.authorAvatarUrl} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{post.authorName}</span>
            <span className="text-xs text-foreground/40">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>

          <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground/90">
            {post.content}
          </p>

          {post.mediaUrls.length > 0 && (
            <div
              className={`mt-3 grid gap-2 overflow-hidden rounded-xl ${
                post.mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"
              }`}
            >
              {post.mediaUrls.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url}
                  src={url.startsWith("http") ? url : `${API_URL}${url}`}
                  alt=""
                  className="max-h-96 w-full object-cover"
                />
              ))}
            </div>
          )}

          <label className="mt-4 flex w-fit cursor-pointer items-center gap-2 text-sm text-foreground/70">
            <input
              type="checkbox"
              checked={notifyInterns}
              disabled={pending !== null}
              onChange={(e) => setNotifyInterns(e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            Include in the daily email digest
          </label>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => handle("approve")}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/20 disabled:opacity-60 dark:text-emerald-400"
            >
              {pending === "approve" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Approve
            </button>
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => handle("reject")}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-500/20 disabled:opacity-60 dark:text-red-400"
            >
              {pending === "reject" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
