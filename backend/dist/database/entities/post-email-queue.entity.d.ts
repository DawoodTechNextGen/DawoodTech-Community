import { type Relation } from 'typeorm';
import { Post } from './post.entity.js';
export declare enum PostEmailStatus {
    QUEUED = "queued",
    SENT = "sent",
    FAILED = "failed",
    SKIPPED = "skipped"
}
export declare class PostEmailQueue {
    id: number;
    postId: number;
    post: Relation<Post>;
    email: string;
    recipientName: string | null;
    status: PostEmailStatus;
    attempts: number;
    lastAttemptAt: Date | null;
    sentAt: Date | null;
    error: string | null;
    createdAt: Date;
}
