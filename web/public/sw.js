// Bump when cached static files change (v2: sharp, regenerated icons).
const CACHE_NAME = 'dawoodtech-community-shell-v2';
const APP_SHELL = ['/', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

// Static assets: cache-first. Everything else (pages, API calls): network-first
// so feed/notification data never goes stale behind the cache.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request)),
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((cached) => cached ?? caches.match('/'))),
  );
});

// --- Web Push ---

// Payload: { title, body, url, tag, badge } from the API's PushService. The
// notification is skipped when an app window is focused — the in-app toast
// already shows it there — but the app-icon badge is always updated.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }

  event.waitUntil(
    Promise.all([
      setIconBadge(data.badge),
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
        if (windows.some((w) => w.focused)) return;
        return showPush(data);
      }),
    ]),
  );
});

/** Unread count on the home-screen icon (iOS 16.4+, desktop Chrome/Edge;
 *  Android launchers show their own dot/count from the notifications). */
function setIconBadge(count) {
  if (typeof count !== 'number' || !('setAppBadge' in self.navigator)) return Promise.resolve();
  return (count > 0 ? self.navigator.setAppBadge(count) : self.navigator.clearAppBadge()).catch(
    () => {},
  );
}

function showPush(data) {
  return self.registration.showNotification(data.title || 'DawoodTech Community', {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    // Monochrome silhouette for the Android status bar.
    badge: '/icons/badge-96.png',
    tag: data.tag,
    renotify: Boolean(data.tag),
    data: { url: data.url || '/notifications' },
  });
}

// Tapping a notification focuses an open app window (navigating it to the
// post/profile), or opens a new one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/notifications', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (existing) {
        return existing.focus().then((w) => w.navigate(target));
      }
      return self.clients.openWindow(target);
    }),
  );
});
