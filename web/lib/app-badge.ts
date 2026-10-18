/** Syncs the OS-level app icon badge (installed PWA) with the unread count.
 *  Supported on Chrome/Edge (Android + desktop) and Safari 16.4+ (iOS/macOS
 *  installed PWAs). Silently does nothing where the Badging API is absent. */
export function syncAppBadge(count: number): void {
  if (typeof navigator === "undefined") return;
  try {
    if (count > 0 && "setAppBadge" in navigator) {
      void (navigator as Navigator & { setAppBadge: (n: number) => Promise<void> })
        .setAppBadge(count)
        .catch(() => {});
    } else if ("clearAppBadge" in navigator) {
      void (navigator as Navigator & { clearAppBadge: () => Promise<void> })
        .clearAppBadge()
        .catch(() => {});
    }
  } catch {
    // Badging API not supported on this platform — no-op.
  }
}

/** Once everything is read, clear the device's notification tray too —
 *  Android launchers base their icon dot/count on what's still in it. */
export function clearDeliveredNotifications(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready
    .then((registration) => registration.getNotifications())
    .then((shown) => shown.forEach((n) => n.close()))
    .catch(() => {});
}
