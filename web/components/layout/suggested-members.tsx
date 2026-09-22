"use client";

import { UserPlus, Users2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { api, ApiError } from "@/lib/api-client";
import type { PublicUser } from "@/lib/types";

export function SuggestedMembers() {
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

  async function handleFollow(user: PublicUser) {
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

  if (loading || members.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white/60 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-2 border-b border-black/5 px-5 py-3.5 dark:border-white/10">
        <Users2 className="h-4 w-4 text-brand" />
        <h2 className="text-sm font-semibold">People to follow</h2>
      </div>
      <ul className="divide-y divide-black/5 dark:divide-white/10">
        {members.map((member) => (
          <li key={member.id} className="flex items-center gap-3 px-5 py-3">
            <Link href={`/profile/${member.id}`} className="shrink-0">
              <Avatar name={member.fullName} src={member.avatarUrl} size={36} />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/profile/${member.id}`}
                className="block truncate text-sm font-medium hover:underline"
              >
                {member.fullName}
              </Link>
              <p className="truncate text-xs text-foreground/45">@{member.username}</p>
            </div>
            <button
              type="button"
              onClick={() => handleFollow(member)}
              disabled={busyId === member.id}
              aria-label={`Follow ${member.fullName}`}
              className="flex shrink-0 items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand/20 disabled:opacity-60"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Follow
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
