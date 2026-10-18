import { api } from "./api-client";

export type PushState = "unsupported" | "unavailable" | "denied" | "off" | "on";

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

/** Where this browser stands: can it get push, and is it subscribed? */
export async function getPushState(): Promise<PushState> {
  if (!isPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const { publicKey } = await api.getPushPublicKey();
  if (!publicKey) return "unavailable";
  return (await currentSubscription()) ? "on" : "off";
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = (value + "=".repeat((4 - (value.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/** Asks permission (must run from a click) and registers this browser. */
export async function enablePush(): Promise<PushState> {
  if (!isPushSupported()) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";

  const { publicKey } = await api.getPushPublicKey();
  if (!publicKey) return "unavailable";

  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToBytes(publicKey),
    }));
  await api.subscribePush(subscription.toJSON());
  return "on";
}

export async function disablePush(): Promise<PushState> {
  if (!isPushSupported()) return "unsupported";
  const subscription = await currentSubscription();
  if (subscription) {
    await api.unsubscribePush(subscription.endpoint).catch(() => {});
    await subscription.unsubscribe();
  }
  return "off";
}

/** On sign-out: stop this device getting the old account's notifications.
 *  Must run while the access token is still valid. */
export async function forgetPushOnSignOut(): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const subscription = await currentSubscription();
    if (!subscription) return;
    await api.unsubscribePush(subscription.endpoint).catch(() => {});
    await subscription.unsubscribe();
  } catch {
    // No service worker yet — nothing to forget.
  }
}
