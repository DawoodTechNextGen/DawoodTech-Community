"use client";

import { Avatar } from "@/components/ui/avatar";
import type { PublicUser } from "@/lib/types";

/** Dropdown for useMentions(); place inside a `relative` wrapper around the field. */
export function MentionMenu({
  open,
  options,
  active,
  pick,
}: {
  open: boolean;
  options: PublicUser[];
  active: number;
  pick: (user: PublicUser) => void;
}) {
  if (!open) return null;
  return (
    <ul
      role="listbox"
      className="absolute left-0 top-full z-30 mt-1 w-64 overflow-hidden rounded-xl border border-black/10 bg-background shadow-lg dark:border-white/10"
    >
      {options.map((user, i) => (
        <li key={user.id} role="option" aria-selected={i === active}>
          <button
            type="button"
            // mousedown, so the field doesn't lose focus (and the menu) first
            onMouseDown={(e) => {
              e.preventDefault();
              pick(user);
            }}
            className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm ${
              i === active ? "bg-brand/10" : "hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Avatar name={user.fullName} src={user.avatarUrl} size={28} />
            <span className="min-w-0">
              <span className="block truncate font-medium">{user.fullName}</span>
              <span className="block truncate text-xs text-foreground/50">@{user.username}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
