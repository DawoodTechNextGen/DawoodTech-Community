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
    reactions: Record<string, number>;
    myReaction: string | null;
    prompt: string | null;
    milestone: string | null;
    pinned: boolean;
    isQuestion: boolean;
    answered: boolean;
}
export declare function toPostResponse(post: Post, viewerId?: number): PostResponse;
