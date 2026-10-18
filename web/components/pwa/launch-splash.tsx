"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

/** Long enough for the intro animation to read, short enough not to feel slow. */
const MIN_VISIBLE_MS = 900;

/**
 * Launch screen for the installed app. It's in the server HTML but only shown
 * by CSS in standalone (installed PWA) mode, so it takes over seamlessly from
 * the phone's own splash — same background, a crisp vector logo — and plays a
 * short intro until the app knows who's signed in. Browsers never see it.
 */
export function LaunchSplash() {
  const { isLoading } = useAuth();
  const [phase, setPhase] = useState<"showing" | "leaving" | "gone">("showing");

  useEffect(() => {
    if (isLoading || phase !== "showing") return;
    const elapsed = performance.now();
    const timer = setTimeout(() => setPhase("leaving"), Math.max(0, MIN_VISIBLE_MS - elapsed));
    return () => clearTimeout(timer);
  }, [isLoading, phase]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = setTimeout(() => setPhase("gone"), 450);
    return () => clearTimeout(timer);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div className={`launch-splash ${phase === "leaving" ? "is-leaving" : ""}`} aria-hidden="true">
      <div className="launch-splash__glow" />
      <svg
        className="launch-splash__logo"
        viewBox="0 0 259 223"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="32" y="0" width="27" height="91" />
        <rect x="1" y="63" width="162" height="28" />
        <rect x="1" y="96" width="79" height="24" />
        <rect x="84" y="96" width="79" height="24" />
        <rect x="52" y="96" width="28" height="126" />
        <rect x="84" y="96" width="28" height="126" />
        <path d="M32 0H137A120.54 111 0 0 1 257.54 111A120.54 111 0 0 1 137 222H84V195H151.6A103 87.2 0 0 0 137 26H32Z" />
      </svg>
      <p className="launch-splash__name">
        DawoodTech <span>Community</span>
      </p>
      <div className="launch-splash__bar">
        <span />
      </div>
    </div>
  );
}
