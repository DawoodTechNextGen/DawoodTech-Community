import type { Comment } from '../database/entities/comment.entity.js';

export interface CommentResponse {
  id: number;
  postId: number;
  authorId: number;
  authorName: string;
  authorAvatarUrl: string | null;
  content: string;
  createdAt: string;
  isOwner: boolean;
}

export function toCommentResponse(
  comment: Comment,
  viewerId?: number,
): CommentResponse {
  return {
    id: comment.id,
    postId: comment.postId,
    authorId: comment.userId,
    authorName: comment.author?.fullName ?? '',
    authorAvatarUrl: comment.author?.avatarUrl ?? null,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    isOwner: comment.userId === viewerId,
  };
}
