"use client";

import { BellOff, CheckCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { NotificationItem } from "@/components/notifications/notification-item";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { api } from "@/lib/api-client";
import type { Notification } from "@/lib/types";
import { useRequireAuth } from "@/lib/use-require-auth";

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useRequireAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getNotifications();
      setNotifications(res.items);
      setCursor(res.nextCursor);
    } catch {
      setError("Couldn't load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const res = await api.getNotifications(cursor);
      setNotifications((prev) => [...prev, ...res.items]);
      setCursor(res.nextCursor);
    } catch {
      setError("Couldn't load more notifications.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleRead(notification: Notification) {
    if (notification.isRead) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
    );
    api.markNotificationRead(notification.id).catch(() => {});
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await api.markAllNotificationsRead();
    } catch {
      setError("Couldn't mark everything as read.");
    } finally {
      setMarkingAll(false);
    }
  }

  const hasUnread = notifications.some((n) => !n.isRead);

  if (authLoading || !user) return null;

  return (
    <AppShell>
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Notifications</h1>
          {hasUnread && (
            <Button variant="ghost" loading={markingAll} onClick={handleMarkAllRead}>
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} />
          </div>
        )}

        {loading ? (
          <div className="space-y-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-3 rounded-xl px-3.5 py-3"
              >
                <div className="h-10 w-10 shrink-0 rounded-full bg-black/10 dark:bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-black/10 dark:bg-white/10" />
                  <div className="h-2.5 w-16 rounded bg-black/10 dark:bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/10 py-16 text-center dark:border-white/10">
            <BellOff className="h-8 w-8 text-foreground/25" />
            <p className="max-w-xs text-sm text-foreground/50">
              No notifications yet — likes, comments and follows will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onRead={handleRead} />
            ))}
          </div>
        )}

        {cursor && !loading && (
          <div className="flex justify-center pt-4">
            <Button variant="ghost" loading={loadingMore} onClick={loadMore}>
              Load more
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
