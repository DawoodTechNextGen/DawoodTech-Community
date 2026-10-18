import type { Comment } from '../database/entities/comment.entity.js';
import { sameId } from '../common/same-id.js';

export interface CommentResponse {
  id: number;
  postId: number;
  parentId: number | null;
  authorId: number;
  authorName: string;
  authorAvatarUrl: string | null;
  content: string;
  createdAt: string;
  isOwner: boolean;
  /** Accepted by the question's author as the answer. */
  accepted: boolean;
}

export function toCommentResponse(comment: Comment, viewerId?: number): CommentResponse {
  return {
    id: comment.id,
    postId: comment.postId,
    parentId: comment.parentId,
    authorId: comment.userId,
    authorName: comment.author?.fullName ?? '',
    authorAvatarUrl: comment.author?.avatarUrl ?? null,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    isOwner: sameId(comment.userId, viewerId),
    accepted: comment.acceptedAt != null,
  };
}
