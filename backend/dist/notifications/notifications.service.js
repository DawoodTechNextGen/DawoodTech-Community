var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsService_1;
import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Notification, NotificationType } from '../database/entities/notification.entity.js';
import { NotificationEvents, } from './notification.events.js';
import { User, UserStatus } from '../database/entities/user.entity.js';
import { extractMentions } from '../common/mentions.js';
import { toNotificationResponse } from './notification.mapper.js';
import { NotificationsGateway } from './notifications.gateway.js';
import { PushService } from '../push/push.service.js';
import { sameId } from '../common/same-id.js';
const PAGE_SIZE = 20;
let NotificationsService = NotificationsService_1 = class NotificationsService {
    notifications;
    gateway;
    push;
    users;
    logger = new Logger(NotificationsService_1.name);
    constructor(notifications, gateway, push, users) {
        this.notifications = notifications;
        this.gateway = gateway;
        this.push = push;
        this.users = users;
    }
    async handleAnswerAccepted({ postId, answerAuthorId, actorId }) {
        if (sameId(answerAuthorId, actorId))
            return;
        await this.record(answerAuthorId, actorId, NotificationType.ANSWER_ACCEPTED, postId);
    }
    async handleAnnouncement({ postId, adminId }) {
        const members = await this.users.find({
            select: { id: true },
            where: { status: UserStatus.ACTIVE, isEmailVerified: true },
        });
        for (const { id } of members) {
            if (sameId(id, adminId))
                continue;
            const already = await this.notifications.existsBy({
                recipientId: id,
                postId,
                type: NotificationType.ANNOUNCEMENT,
            });
            if (!already)
                await this.record(id, adminId, NotificationType.ANNOUNCEMENT, postId);
        }
    }
    async handleMentions({ postId, actorId, text, skipUserIds }) {
        const usernames = extractMentions(text);
        if (usernames.length === 0)
            return;
        const mentioned = await this.users.find({
            select: { id: true },
            where: { username: In(usernames), status: UserStatus.ACTIVE },
        });
        for (const { id } of mentioned) {
            if (sameId(id, actorId) || skipUserIds.some((skip) => sameId(skip, id)))
                continue;
            const already = await this.notifications.existsBy({
                recipientId: id,
                actorId,
                postId,
                type: NotificationType.MENTION,
            });
            if (!already)
                await this.record(id, actorId, NotificationType.MENTION, postId);
        }
    }
    async handleCommentCreated({ postId, postOwnerId, actorId }) {
        if (sameId(postOwnerId, actorId))
            return;
        await this.record(postOwnerId, actorId, NotificationType.COMMENT, postId);
    }
    async handleReplyCreated({ postId, parentCommentAuthorId, actorId }) {
        if (sameId(parentCommentAuthorId, actorId))
            return;
        await this.record(parentCommentAuthorId, actorId, NotificationType.REPLY, postId);
    }
    async handleLikeCreated({ postId, postOwnerId, actorId }) {
        if (sameId(postOwnerId, actorId))
            return;
        const already = await this.notifications.existsBy({
            recipientId: postOwnerId,
            actorId,
            postId,
            type: NotificationType.LIKE,
        });
        if (!already)
            await this.record(postOwnerId, actorId, NotificationType.LIKE, postId);
    }
    async handleFollowCreated({ followingId, followerId }) {
        await this.record(followingId, followerId, NotificationType.FOLLOW, null);
    }
    async handlePostApproved({ postId, authorId, adminId }) {
        if (sameId(authorId, adminId))
            return;
        await this.record(authorId, adminId, NotificationType.POST_APPROVED, postId);
    }
    async handlePostRejected({ postId, authorId, adminId }) {
        if (sameId(authorId, adminId))
            return;
        await this.record(authorId, adminId, NotificationType.POST_REJECTED, postId);
    }
    async record(recipientId, actorId, type, postId) {
        const saved = await this.notifications.save(this.notifications.create({ recipientId, actorId, type, postId }));
        try {
            const [withActor, unread] = await Promise.all([
                this.notifications.findOneOrFail({
                    where: { id: saved.id },
                    relations: { actor: true },
                }),
                this.unreadCount(recipientId),
            ]);
            const response = toNotificationResponse(withActor);
            this.gateway.sendNotification(recipientId, response, unread);
            void this.push.sendToUser(recipientId, { ...pushMessageFor(response), badge: unread });
        }
        catch (err) {
            this.logger.warn(`Couldn't push notification ${saved.id}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    async findForUser(userId, cursor) {
        const qb = this.notifications
            .createQueryBuilder('notification')
            .leftJoinAndSelect('notification.actor', 'actor')
            .where('notification.recipientId = :userId', { userId })
            .orderBy('notification.createdAt', 'DESC')
            .take(PAGE_SIZE);
        if (cursor) {
            qb.andWhere('notification.createdAt < :cursor', {
                cursor: new Date(cursor),
            });
        }
        const rows = await qb.getMany();
        return {
            items: rows.map(toNotificationResponse),
            nextCursor: rows.length === PAGE_SIZE ? rows[rows.length - 1].createdAt.toISOString() : null,
        };
    }
    async unreadCount(userId) {
        return this.notifications.count({
            where: { recipientId: userId, isRead: false },
        });
    }
    async markRead(id, userId) {
        const notification = await this.notifications.findOneBy({ id });
        if (!notification)
            throw new NotFoundException('Notification not found');
        if (!sameId(notification.recipientId, userId)) {
            throw new ForbiddenException('Not your notification');
        }
        if (!notification.isRead) {
            notification.isRead = true;
            await this.notifications.save(notification);
            await this.syncUnreadCount(userId);
        }
    }
    async markAllRead(userId) {
        await this.notifications.update({ recipientId: userId, isRead: false }, { isRead: true });
        await this.syncUnreadCount(userId);
    }
    async syncUnreadCount(userId) {
        this.gateway.sendUnreadCount(userId, await this.unreadCount(userId));
    }
};
__decorate([
    OnEvent(NotificationEvents.AnswerAccepted),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "handleAnswerAccepted", null);
__decorate([
    OnEvent(NotificationEvents.AnnouncementPinned),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "handleAnnouncement", null);
__decorate([
    OnEvent(NotificationEvents.MentionsPublished),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "handleMentions", null);
__decorate([
    OnEvent(NotificationEvents.CommentCreated),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "handleCommentCreated", null);
__decorate([
    OnEvent(NotificationEvents.ReplyCreated),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "handleReplyCreated", null);
__decorate([
    OnEvent(NotificationEvents.LikeCreated),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "handleLikeCreated", null);
__decorate([
    OnEvent(NotificationEvents.FollowCreated),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "handleFollowCreated", null);
__decorate([
    OnEvent(NotificationEvents.PostApproved),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "handlePostApproved", null);
__decorate([
    OnEvent(NotificationEvents.PostRejected),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "handlePostRejected", null);
NotificationsService = NotificationsService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(Notification)),
    __param(3, InjectRepository(User)),
    __metadata("design:paramtypes", [Repository,
        NotificationsGateway,
        PushService,
        Repository])
], NotificationsService);
export { NotificationsService };
function pushMessageFor(n) {
    const who = n.actorName || 'Someone';
    const post = n.postId ? `/post/${n.postId}` : '/notifications';
    switch (n.type) {
        case NotificationType.COMMENT:
            return {
                title: 'New comment',
                body: `${who} commented on your post`,
                url: post,
                tag: `post-${n.postId}`,
            };
        case NotificationType.REPLY:
            return {
                title: 'New reply',
                body: `${who} replied to your comment`,
                url: post,
                tag: `post-${n.postId}`,
            };
        case NotificationType.LIKE:
            return {
                title: 'New reaction',
                body: `${who} reacted to your post`,
                url: post,
                tag: `like-${n.postId}`,
            };
        case NotificationType.FOLLOW:
            return {
                title: 'New follower',
                body: `${who} started following you`,
                url: `/profile/${n.actorId}`,
            };
        case NotificationType.POST_APPROVED:
            return {
                title: 'Post approved',
                body: 'Your post was approved and is now live',
                url: post,
            };
        case NotificationType.MENTION:
            return {
                title: 'You were mentioned',
                body: `${who} mentioned you`,
                url: post,
                tag: `post-${n.postId}`,
            };
        case NotificationType.ANNOUNCEMENT:
            return { title: '📢 Announcement', body: `${who} posted an announcement`, url: post };
        case NotificationType.ANSWER_ACCEPTED:
            return { title: '✅ Answer accepted', body: `${who} accepted your answer`, url: post };
        case NotificationType.POST_REJECTED:
            return {
                title: 'Post not approved',
                body: "Your post wasn't approved",
                url: post,
            };
    }
}
//# sourceMappingURL=notifications.service.js.map