import { type Relation } from 'typeorm';
import { User } from './user.entity.js';
import { PostMedia } from './post-media.entity.js';
export declare enum PostStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare class Post {
    id: number;
    userId: number;
    author: Relation<User>;
    content: string;
    status: PostStatus;
    reviewedBy: number | null;
    reviewedAt: Date | null;
    notifiedAt: Date | null;
    media: Relation<PostMedia>[];
    createdAt: Date;
    updatedAt: Date;
}
