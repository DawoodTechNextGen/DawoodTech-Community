import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import type { LeaderboardEntry } from "@/lib/types";

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardRow({
  entry,
  highlight = false,
  detailed = false,
}: {
  entry: LeaderboardEntry;
  highlight?: boolean;
  detailed?: boolean;
}) {
  return (
    <li
      className={`flex items-center gap-3 px-5 py-3 ${highlight ? "bg-brand/5" : ""}`}
    >
      <span className="w-6 shrink-0 text-center text-sm font-semibold text-foreground/50">
        {MEDALS[entry.rank - 1] ?? entry.rank}
      </span>
      <Link href={`/profile/${entry.user.id}`} className="shrink-0">
        <Avatar name={entry.user.fullName} src={entry.user.avatarUrl} size={36} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/profile/${entry.user.id}`}
          className="block truncate text-sm font-medium hover:underline"
        >
          {entry.user.fullName}
        </Link>
        {detailed && (
          <p className="text-xs text-foreground/50">
            {entry.posts} posts · {entry.comments} comments · {entry.reactions} reactions
          </p>
        )}
      </div>
      <span className="shrink-0 text-sm font-semibold text-brand">{entry.points} pts</span>
    </li>
  );
}
