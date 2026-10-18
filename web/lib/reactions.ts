import { api } from "./api-client";
import type { Post, Reaction } from "./types";

export const REACTIONS: { key: Reaction; emoji: string; label: string }[] = [
  { key: "like", emoji: "❤️", label: "Like" },
  { key: "clap", emoji: "👏", label: "Applause" },
  { key: "celebrate", emoji: "🎉", label: "Celebrate" },
  { key: "insightful", emoji: "💡", label: "Insightful" },
  { key: "fire", emoji: "🔥", label: "Fire" },
];

export const reactionEmoji = (key: string) => REACTIONS.find((r) => r.key === key)?.emoji ?? "❤️";

/** The post as it looks after the viewer reacts with `next` (null = remove) —
 *  for optimistic updates. */
export function applyReaction(post: Post, next: Reaction | null): Post {
  const reactions = { ...post.reactions };
  if (post.myReaction) reactions[post.myReaction] = Math.max(0, (reactions[post.myReaction] ?? 1) - 1);
  if (next) reactions[next] = (reactions[next] ?? 0) + 1;
  for (const key of Object.keys(reactions) as Reaction[]) if (!reactions[key]) delete reactions[key];
  return {
    ...post,
    reactions,
    myReaction: next,
    likedByMe: next !== null,
    likeCount: Object.values(reactions).reduce((sum, n) => sum + n, 0),
  };
}

/** Saves a reaction change; resolves to false if the server refused it. */
export async function saveReaction(post: Post, next: Reaction | null): Promise<boolean> {
  try {
    if (next) await api.like(post.id, next);
    else await api.unlike(post.id);
    return true;
  } catch {
    return false;
  }
}
