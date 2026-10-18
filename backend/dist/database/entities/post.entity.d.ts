import { type Relation } from 'typeorm';
import { User } from './user.entity.js';
import { PostMedia } from './post-media.entity.js';
import { MilestoneKind } from './milestone.entity.js';
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
    promptDay: string | null;
    promptText: string | null;
    isQuestion: boolean;
    pinnedAt: Date | null;
    milestone: MilestoneKind | null;
    media: Relation<PostMedia>[];
    createdAt: Date;
    updatedAt: Date;
}
