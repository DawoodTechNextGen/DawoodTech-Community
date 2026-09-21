import { Repository } from 'typeorm';
import { Notification } from '../database/entities/notification.entity.js';
import { type CommentCreatedEvent, type FollowCreatedEvent, type LikeCreatedEvent, type PostReviewedEvent } from './notification.events.js';
import { type NotificationResponse } from './notification.mapper.js';
export declare class NotificationsService {
    private readonly notifications;
    constructor(notifications: Repository<Notification>);
    handleCommentCreated({ postId, postOwnerId, actorId }: CommentCreatedEvent): Promise<void>;
    handleLikeCreated({ postId, postOwnerId, actorId }: LikeCreatedEvent): Promise<void>;
    handleFollowCreated({ followingId, followerId }: FollowCreatedEvent): Promise<void>;
    handlePostApproved({ postId, authorId, adminId }: PostReviewedEvent): Promise<void>;
    handlePostRejected({ postId, authorId, adminId }: PostReviewedEvent): Promise<void>;
    private record;
    findForUser(userId: number, cursor?: string): Promise<{
        items: NotificationResponse[];
        nextCursor: string | null;
    }>;
    unreadCount(userId: number): Promise<number>;
    markRead(id: number, userId: number): Promise<void>;
    markAllRead(userId: number): Promise<void>;
}
