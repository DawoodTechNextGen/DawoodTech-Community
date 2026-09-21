import { type Relation } from 'typeorm';
import { Post } from './post.entity.js';
import { User } from './user.entity.js';
export declare enum NotificationType {
    COMMENT = "comment",
    FOLLOW = "follow",
    LIKE = "like",
    POST_APPROVED = "post_approved",
    POST_REJECTED = "post_rejected"
}
export declare class Notification {
    id: number;
    recipientId: number;
    recipient: Relation<User>;
    actorId: number;
    actor: Relation<User>;
    type: NotificationType;
    postId: number | null;
    post: Relation<Post> | null;
    isRead: boolean;
    createdAt: Date;
}
