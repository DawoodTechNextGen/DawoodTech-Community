"use client";

import { UserPlus, Users2 } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { useSuggestedMembers } from "@/lib/use-suggested-members";

export function SuggestedMembers() {
  const { members, loading, busyId, follow } = useSuggestedMembers();

  if (loading || members.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white/60 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-2 border-b border-black/5 px-5 py-3.5 dark:border-white/10">
        <Users2 className="h-4 w-4 text-brand" />
        <h2 className="text-sm font-semibold">People to follow</h2>
      </div>
      <ul className="scrollbar-subtle max-h-[45vh] divide-y divide-black/5 overflow-y-auto dark:divide-white/10">
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
              onClick={() => follow(member)}
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
