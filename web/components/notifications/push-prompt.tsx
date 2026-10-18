"use client";

import { BellRing, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { disablePush, enablePush, getPushState, type PushState } from "@/lib/push";

const DISMISS_KEY = "dtc_push_banner_dismissed";

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function usePushState() {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPushState()
      .then((s) => !cancelled && setState(s))
      .catch(() => !cancelled && setState("unavailable"));
    return () => {
      cancelled = true;
    };
  }, []);

  async function run(action: () => Promise<PushState>) {
    setBusy(true);
    try {
      setState(await action());
    } catch {
      setState(await getPushState().catch(() => "unavailable" as const));
    } finally {
      setBusy(false);
    }
  }

  return { state, busy, enable: () => run(enablePush), disable: () => run(disablePush) };
}

/** Feed banner inviting members to turn on phone/desktop notifications.
 *  Shown only while push is possible but off, until dismissed. */
export function PushBanner() {
  const { state, busy, enable } = usePushState();
  const [dismissed, setDismissed] = useState(readDismissed);

  if (state !== "off" || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Private mode — it just shows again next time.
    }
  }

  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-brand/20 bg-brand/5 p-4">
      <BellRing className="h-5 w-5 shrink-0 text-brand" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Never miss a like or comment</p>
        <p className="text-xs text-foreground/60">
          Get a notification on this device, even when the app is closed.
        </p>
      </div>
      <Button loading={busy} onClick={enable}>
        Turn on
      </Button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Not now"
        className="shrink-0 rounded-full p-1 text-foreground/40 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/** On/off control for the notifications page. */
export function PushToggle() {
  const { state, busy, enable, disable } = usePushState();

  if (state === null || state === "unsupported" || state === "unavailable") return null;

  if (state === "denied") {
    return (
      <p className="text-xs text-foreground/50">
        Device notifications are blocked — allow them in your browser&apos;s site settings.
      </p>
    );
  }

  return (
    <Button variant="ghost" loading={busy} onClick={state === "on" ? disable : enable}>
      <BellRing className="h-4 w-4" />
      {state === "on" ? "Device alerts on" : "Turn on device alerts"}
    </Button>
  );
}
