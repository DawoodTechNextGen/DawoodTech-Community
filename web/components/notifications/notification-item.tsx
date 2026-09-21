import { CheckCircle2, Heart, MessageCircle, UserPlus, XCircle } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/format";
import type { Notification, NotificationType } from "@/lib/types";

const ICONS: Record<NotificationType, typeof Heart> = {
  comment: MessageCircle,
  follow: UserPlus,
  like: Heart,
  post_approved: CheckCircle2,
  post_rejected: XCircle,
};

const ICON_COLORS: Record<NotificationType, string> = {
  comment: "text-sky-500",
  follow: "text-violet-500",
  like: "text-rose-500",
  post_approved: "text-emerald-500",
  post_rejected: "text-red-500",
};

function messageFor(n: Notification): string {
  switch (n.type) {
    case "comment":
      return "commented on your post";
    case "follow":
      return "started following you";
    case "like":
      return "liked your post";
    case "post_approved":
      return "Your post was approved and is now live";
    case "post_rejected":
      return "Your post wasn't approved";
  }
}

export function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (notification: Notification) => void;
}) {
  const Icon = ICONS[notification.type];
  const isSystemMessage =
    notification.type === "post_approved" || notification.type === "post_rejected";

  const content = (
    <div
      className={`flex items-start gap-3 rounded-xl px-3.5 py-3 transition-colors ${
        notification.isRead
          ? "hover:bg-black/5 dark:hover:bg-white/5"
          : "bg-brand/5 hover:bg-brand/10"
      }`}
    >
      <div className="relative shrink-0">
        <Avatar name={notification.actorName} src={notification.actorAvatarUrl} size={40} />
        <span
          className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background ${ICON_COLORS[notification.type]}`}
        >
          <Icon className="h-3.5 w-3.5 fill-current" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          {!isSystemMessage && <span className="font-semibold">{notification.actorName}</span>}{" "}
          <span className="text-foreground/80">{messageFor(notification)}</span>
        </p>
        <span className="text-xs text-foreground/40">
          {formatRelativeTime(notification.createdAt)}
        </span>
      </div>
      {!notification.isRead && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
      )}
    </div>
  );

  if (notification.postId) {
    return (
      <Link href={`/post/${notification.postId}`} onClick={() => onRead(notification)}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onRead(notification)}
      className="block w-full text-left"
    >
      {content}
    </button>
  );
}
