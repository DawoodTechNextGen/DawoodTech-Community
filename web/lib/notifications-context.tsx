"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL, api, refreshAccessToken } from "./api-client";
import { clearDeliveredNotifications, syncAppBadge } from "./app-badge";
import { useAuth } from "./auth-context";
import { tokenStorage } from "./token-storage";
import type { Notification } from "./types";

type Listener<T> = (value: T) => void;

interface NotificationsContextValue {
  unreadCount: number;
  /** Admins only: posts waiting in the review queue. */
  pendingCount: number;
  /** The newest notification that arrived live, for the toast. */
  latest: Notification | null;
  dismissLatest: () => void;
  /** Called with each notification as it arrives. Returns an unsubscribe. */
  onNotification: (listener: Listener<Notification>) => () => void;
  /** Admins only: called whenever the review queue changes. */
  onPendingPostsChanged: (listener: Listener<void>) => () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

/** Socket.IO treats a URL path as a namespace, so an API served under a path
 *  (https://example.com/api) needs it moved into the `path` option. */
function socketTarget(): { url: string; path: string } {
  const api = new URL(API_URL);
  const base = api.pathname.replace(/\/+$/, "");
  return { url: `${api.origin}/notifications`, path: `${base}/socket.io` };
}

/**
 * Live in-app notifications. While someone is signed in, one Socket.IO
 * connection per tab receives new notifications, unread-count changes and
 * (for admins) review-queue changes as they happen — no polling.
 */
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  // Keyed on id + role, so a profile edit doesn't reconnect the socket.
  const userId = user?.id;
  const isAdmin = user?.role === "admin";
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [latest, setLatest] = useState<Notification | null>(null);
  const notificationListeners = useRef(new Set<Listener<Notification>>());
  const pendingListeners = useRef(new Set<Listener<void>>());

  // Signed out: everything reads as empty; the next sign-in refetches.
  const visibleUnread = userId ? unreadCount : 0;

  useEffect(() => {
    syncAppBadge(visibleUnread);
    if (userId && visibleUnread === 0) clearDeliveredNotifications();
  }, [userId, visibleUnread]);

  useEffect(() => {
    if (!userId) return;

    let closed = false;
    const refreshPending = () => {
      if (!isAdmin) return;
      api
        .getPendingPosts()
        .then((posts) => !closed && setPendingCount(posts.length))
        .catch(() => {});
    };
    const refreshUnread = () => {
      api
        .getUnreadCount()
        .then(({ count }) => !closed && setUnreadCount(count))
        .catch(() => {});
    };

    const { url, path } = socketTarget();
    const socket: Socket = io(url, {
      path,
      // A function, so every (re)connect sends the current access token.
      auth: (cb) => cb({ token: tokenStorage.get()?.accessToken ?? "" }),
    });

    // The server rejects an expired or revoked token, and closes the
    // connection itself after a role or status change. Either way: get a
    // fresh token and reconnect — unless refreshing fails (signed out/blocked).
    // One retry per successful connection, so a token the server keeps
    // rejecting can't spin into a refresh loop.
    let retriedAuth = false;
    const reconnectWithFreshToken = async () => {
      if (retriedAuth) return;
      retriedAuth = true;
      const token = await refreshAccessToken();
      if (token && !closed) socket.connect();
    };

    socket.on("connect", () => {
      retriedAuth = false;
      // Catch up on anything that happened while disconnected.
      refreshUnread();
      refreshPending();
    });
    socket.on("connect_error", (err) => {
      if (err.message === "unauthorized") void reconnectWithFreshToken();
    });
    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") void reconnectWithFreshToken();
    });
    socket.on(
      "notification:new",
      ({ notification, unreadCount }: { notification: Notification; unreadCount: number }) => {
        setUnreadCount(unreadCount);
        setLatest(notification);
        notificationListeners.current.forEach((listener) => listener(notification));
      },
    );
    socket.on("notification:unread-count", ({ count }: { count: number }) => {
      setUnreadCount(count);
    });
    socket.on("admin:pending-posts-changed", () => {
      refreshPending();
      pendingListeners.current.forEach((listener) => listener());
    });

    return () => {
      closed = true;
      socket.disconnect();
    };
  }, [userId, isAdmin]);

  const onNotification = useCallback((listener: Listener<Notification>) => {
    notificationListeners.current.add(listener);
    return () => {
      notificationListeners.current.delete(listener);
    };
  }, []);

  const onPendingPostsChanged = useCallback((listener: Listener<void>) => {
    pendingListeners.current.add(listener);
    return () => {
      pendingListeners.current.delete(listener);
    };
  }, []);

  const dismissLatest = useCallback(() => setLatest(null), []);

  return (
    <NotificationsContext.Provider
      value={{
        unreadCount: visibleUnread,
        pendingCount: userId && isAdmin ? pendingCount : 0,
        latest: userId ? latest : null,
        dismissLatest,
        onNotification,
        onPendingPostsChanged,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
