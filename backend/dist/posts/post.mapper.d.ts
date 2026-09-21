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
export declare function toPostResponse(post: Post, viewerId?: number): PostResponse;
