import type { Post } from '../database/entities/post.entity.js';
import { sameId } from '../common/same-id.js';

export interface PostResponse {
  id: number;
  authorId: number;
  authorName: string;
  authorAvatarUrl: string | null;
  content: string;
  status: string;
  createdAt: string;
  mediaUrls: string[];
  isOwner: boolean;
  likeCount: number;
  commentCount: number;
  /** Any reaction from the viewer (kept for older app versions). */
  likedByMe: boolean;
  /** Count per reaction, e.g. { like: 3, clap: 1 }; likeCount is their total. */
  reactions: Record<string, number>;
  myReaction: string | null;
  /** The daily question this post answers, if any. */
  prompt: string | null;
  /** 'joined' | 'internship_completed' for auto-shared celebration posts. */
  milestone: string | null;
  /** Pinned by an admin as an announcement. */
  pinned: boolean;
  /** Asked as a question… */
  isQuestion: boolean;
  /** …and its author accepted an answer. */
  answered: boolean;
}

export function toPostResponse(post: Post, viewerId?: number): PostResponse {
  return {
    id: post.id,
    authorId: post.userId,
    authorName: post.author?.fullName ?? '',
    authorAvatarUrl: post.author?.avatarUrl ?? null,
    content: post.content,
    status: post.status,
    createdAt: post.createdAt.toISOString(),
    mediaUrls: (post.media ?? []).sort((a, b) => a.sortOrder - b.sortOrder).map((m) => m.url),
    isOwner: sameId(post.userId, viewerId),
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
    reactions: {},
    myReaction: null,
    prompt: post.promptText ?? null,
    milestone: post.milestone ?? null,
    pinned: post.pinnedAt != null,
    isQuestion: !!post.isQuestion,
    answered: false,
  };
}
