"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import type { PublicUser } from "@/lib/types";

export function useSuggestedMembers() {
  const [members, setMembers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getSuggestedUsers()
      .then((res) => {
        if (!cancelled) setMembers(res);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function follow(user: PublicUser) {
    setBusyId(user.id);
    try {
      await api.followUser(user.id);
      setMembers((prev) => prev.filter((m) => m.id !== user.id));
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
    } finally {
      setBusyId(null);
    }
  }

  return { members, loading, busyId, follow };
}
