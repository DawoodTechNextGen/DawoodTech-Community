"use client";

import { CheckCircle2, Circle, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type OnboardingProgress } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { enablePush, getPushState, type PushState } from "@/lib/push";

const FOLLOW_GOAL = 3;
const dismissKey = (userId: string) => `dtc_welcome_dismissed_${userId}`;

function wasDismissed(userId: string): boolean {
  try {
    return localStorage.getItem(dismissKey(userId)) === "1";
  } catch {
    return false;
  }
}

interface Step {
  done: boolean;
  label: string;
  action?: React.ReactNode;
}

/**
 * "Getting started" card on the feed: the handful of things that turn a new
 * signup into someone who comes back — a face, a bio, people to follow, a
 * first post, and alerts on their device. Disappears once everything is done
 * (or when dismissed). `refreshKey` changes when the feed knows something
 * happened (e.g. a post was submitted).
 */
export function WelcomeChecklist({
  refreshKey,
  onFindPeople,
}: {
  refreshKey: number;
  onFindPeople: () => void;
}) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [push, setPush] = useState<PushState | null>(null);
  const [justDismissed, setJustDismissed] = useState(false);
  // Only rendered client-side after sign-in, so reading storage here is safe.
  const dismissed = !user || justDismissed || wasDismissed(user.id);

  useEffect(() => {
    if (!user || dismissed) return;
    let cancelled = false;
    const load = () => {
      api
        .getOnboardingProgress()
        .then((p) => !cancelled && setProgress(p))
        .catch(() => {});
    };
    load();
    getPushState()
      .then((s) => !cancelled && setPush(s))
      .catch(() => {});
    // Coming back from the profile page after adding a photo, say.
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
    };
  }, [user, dismissed, refreshKey]);

  if (!user || dismissed || !progress) return null;

  const pushPossible = push === "on" || push === "off";
  const steps: Step[] = [
    {
      done: progress.hasAvatar,
      label: "Add a profile photo",
      action: <Link href={`/profile/${user.id}`}>Add photo</Link>,
    },
    {
      done: progress.hasBio,
      label: "Write a one-line bio",
      action: <Link href={`/profile/${user.id}`}>Edit profile</Link>,
    },
    {
      done: progress.followingCount >= FOLLOW_GOAL,
      label: `Follow ${FOLLOW_GOAL} people (${Math.min(progress.followingCount, FOLLOW_GOAL)}/${FOLLOW_GOAL})`,
      action: (
        <button type="button" onClick={onFindPeople}>
          Find people
        </button>
      ),
    },
    { done: progress.postCount > 0, label: "Share your first win in the box below" },
    ...(pushPossible
      ? [
          {
            done: push === "on",
            label: "Turn on notifications on this device",
            action: (
              <button
                type="button"
                onClick={() => enablePush().then(setPush).catch(() => {})}
              >
                Turn on
              </button>
            ),
          },
        ]
      : []),
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  function dismiss() {
    setJustDismissed(true);
    try {
      localStorage.setItem(dismissKey(user!.id), "1");
    } catch {
      // Private mode — it shows again next visit.
    }
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white/60 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Getting started</p>
          <p className="text-xs text-foreground/50">
            {doneCount} of {steps.length} done
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Hide getting started"
          className="shrink-0 rounded-full p-1 text-foreground/40 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ul className="mt-4 space-y-2.5">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-2.5 text-sm">
            {step.done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-foreground/25" />
            )}
            <span className={`flex-1 ${step.done ? "text-foreground/40 line-through" : ""}`}>
              {step.label}
            </span>
            {!step.done && step.action && (
              <span className="shrink-0 text-xs font-semibold text-brand hover:underline">
                {step.action}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
