import type { Comment } from '../database/entities/comment.entity.js';
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
    accepted: boolean;
}
export declare function toCommentResponse(comment: Comment, viewerId?: number): CommentResponse;
