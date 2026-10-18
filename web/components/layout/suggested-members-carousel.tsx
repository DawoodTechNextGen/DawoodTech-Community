"use client";

import { Loader2, UserPlus, Users2 } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { useSuggestedMembers } from "@/lib/use-suggested-members";

export function SuggestedMembersCarousel() {
  const { members, loading, busyId, follow } = useSuggestedMembers();

  if (loading || members.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 px-0.5">
        <Users2 className="h-4 w-4 text-brand" />
        <h2 className="text-sm font-semibold">People to follow</h2>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex w-[118px] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border border-black/5 bg-white/60 p-3 text-center shadow-sm dark:border-white/10 dark:bg-white/5"
          >
            <Link href={`/profile/${member.id}`}>
              <Avatar name={member.fullName} src={member.avatarUrl} size={56} />
            </Link>
            <Link
              href={`/profile/${member.id}`}
              className="line-clamp-1 w-full text-xs font-medium hover:underline"
            >
              {member.fullName}
            </Link>
            <button
              type="button"
              onClick={() => follow(member)}
              disabled={busyId === member.id}
              aria-label={`Follow ${member.fullName}`}
              className="flex w-full items-center justify-center gap-1 rounded-full bg-brand/10 px-2 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand/20 disabled:opacity-60"
            >
              {busyId === member.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  Follow
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
