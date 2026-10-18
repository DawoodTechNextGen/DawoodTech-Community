"use client";

import { useAuth } from "@/lib/auth-context";

/**
 * A small circular spinner while the app checks who's signed in — what a
 * reload or pull-to-refresh shows (the full launch screen is only for opening
 * the app; on that first load it covers this). Pages then show their own
 * skeletons while their data loads.
 */
export function BootSpinner() {
  const { isLoading } = useAuth();
  if (!isLoading) return null;
  return (
    <div className="boot-spinner" role="status" aria-label="Loading">
      <span />
    </div>
  );
}
