import type { Post } from '../database/entities/post.entity.js';

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
  likedByMe: boolean;
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
    mediaUrls: (post.media ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((m) => m.url),
    isOwner: post.userId === viewerId,
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
  };
}
