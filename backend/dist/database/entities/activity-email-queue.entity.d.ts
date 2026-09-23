import { type Relation } from 'typeorm';
import { Post } from './post.entity.js';
import { PostEmailStatus } from './post-email-queue.entity.js';
export declare enum ActivityEmailType {
    LIKE = "like",
    COMMENT = "comment",
    REPLY = "reply",
    THREAD_COMMENT = "thread_comment"
}
export declare class ActivityEmailQueue {
    id: number;
    dedupeKey: string;
    recipientUserId: number;
    email: string;
    type: ActivityEmailType;
    postId: number;
    post: Relation<Post>;
    actorId: number;
    commentId: number | null;
    status: PostEmailStatus;
    attempts: number;
    lastAttemptAt: Date | null;
    sentAt: Date | null;
    error: string | null;
    createdAt: Date;
}
