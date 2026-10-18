"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { useNotifications } from "@/lib/notifications-context";
import { messageFor } from "./notification-item";

const VISIBLE_MS = 6000;

/** A short-lived pop-up for each notification that arrives while the app is open. */
export function NotificationToast() {
  const { latest, dismissLatest } = useNotifications();

  useEffect(() => {
    if (!latest) return;
    const timer = setTimeout(dismissLatest, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [latest, dismissLatest]);

  if (!latest) return null;

  const isSystemMessage = latest.type === "post_approved" || latest.type === "post_rejected";
  const href =
    latest.type === "follow"
      ? `/profile/${latest.actorId}`
      : latest.postId
        ? `/post/${latest.postId}`
        : "/notifications";

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-sm md:bottom-6 md:left-auto md:right-6 md:mx-0"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-background p-3 shadow-lg dark:border-white/10">
        <Link href={href} onClick={dismissLatest} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={latest.actorName} src={latest.actorAvatarUrl} size={36} />
          <p className="min-w-0 text-sm">
            {!isSystemMessage && <span className="font-semibold">{latest.actorName}</span>}{" "}
            <span className="text-foreground/80">{messageFor(latest)}</span>
          </p>
        </Link>
        <button
          type="button"
          onClick={dismissLatest}
          aria-label="Dismiss"
          className="shrink-0 rounded-full p-1 text-foreground/40 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
