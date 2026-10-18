import { Repository } from 'typeorm';
import { Notification } from '../database/entities/notification.entity.js';
import { type CommentCreatedEvent, type ReplyCreatedEvent, type FollowCreatedEvent, type LikeCreatedEvent, type PostReviewedEvent, type MentionsPublishedEvent, type AnnouncementPinnedEvent, type AnswerAcceptedEvent } from './notification.events.js';
import { User } from '../database/entities/user.entity.js';
import { type NotificationResponse } from './notification.mapper.js';
import { NotificationsGateway } from './notifications.gateway.js';
import { PushService } from '../push/push.service.js';
export declare class NotificationsService {
    private readonly notifications;
    private readonly gateway;
    private readonly push;
    private readonly users;
    private readonly logger;
    constructor(notifications: Repository<Notification>, gateway: NotificationsGateway, push: PushService, users: Repository<User>);
    handleAnswerAccepted({ postId, answerAuthorId, actorId }: AnswerAcceptedEvent): Promise<void>;
    handleAnnouncement({ postId, adminId }: AnnouncementPinnedEvent): Promise<void>;
    handleMentions({ postId, actorId, text, skipUserIds }: MentionsPublishedEvent): Promise<void>;
    handleCommentCreated({ postId, postOwnerId, actorId }: CommentCreatedEvent): Promise<void>;
    handleReplyCreated({ postId, parentCommentAuthorId, actorId }: ReplyCreatedEvent): Promise<void>;
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
    private syncUnreadCount;
}
