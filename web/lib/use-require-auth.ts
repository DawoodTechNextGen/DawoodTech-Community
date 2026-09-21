"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./auth-context";

/** Redirects to /login once auth state resolves and no user is present.
 *  Returns the same values as useAuth() for convenience. */
export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && !auth.user) router.replace("/login");
  }, [auth.isLoading, auth.user, router]);

  return auth;
}
