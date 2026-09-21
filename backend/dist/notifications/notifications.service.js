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
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, } from '../database/entities/notification.entity.js';
import { NotificationEvents, } from './notification.events.js';
import { toNotificationResponse } from './notification.mapper.js';
const PAGE_SIZE = 20;
let NotificationsService = class NotificationsService {
    notifications;
    constructor(notifications) {
        this.notifications = notifications;
    }
    async handleCommentCreated({ postId, postOwnerId, actorId }) {
        if (postOwnerId === actorId)
            return;
        await this.record(postOwnerId, actorId, NotificationType.COMMENT, postId);
    }
    async handleLikeCreated({ postId, postOwnerId, actorId }) {
        if (postOwnerId === actorId)
            return;
        await this.record(postOwnerId, actorId, NotificationType.LIKE, postId);
    }
    async handleFollowCreated({ followingId, followerId }) {
        await this.record(followingId, followerId, NotificationType.FOLLOW, null);
    }
    async handlePostApproved({ postId, authorId, adminId }) {
        if (authorId === adminId)
            return;
        await this.record(authorId, adminId, NotificationType.POST_APPROVED, postId);
    }
    async handlePostRejected({ postId, authorId, adminId }) {
        if (authorId === adminId)
            return;
        await this.record(authorId, adminId, NotificationType.POST_REJECTED, postId);
    }
    async record(recipientId, actorId, type, postId) {
        await this.notifications.save(this.notifications.create({ recipientId, actorId, type, postId }));
    }
    async findForUser(userId, cursor) {
        const qb = this.notifications
            .createQueryBuilder('notification')
            .leftJoinAndSelect('notification.actor', 'actor')
            .where('notification.recipientId = :userId', { userId })
            .orderBy('notification.createdAt', 'DESC')
            .take(PAGE_SIZE);
        if (cursor) {
            qb.andWhere('notification.createdAt < :cursor', { cursor: new Date(cursor) });
        }
        const rows = await qb.getMany();
        return {
            items: rows.map(toNotificationResponse),
            nextCursor: rows.length === PAGE_SIZE
                ? rows[rows.length - 1].createdAt.toISOString()
                : null,
        };
    }
    async unreadCount(userId) {
        return this.notifications.count({ where: { recipientId: userId, isRead: false } });
    }
    async markRead(id, userId) {
        const notification = await this.notifications.findOneBy({ id });
        if (!notification)
            throw new NotFoundException('Notification not found');
        if (notification.recipientId !== userId) {
            throw new ForbiddenException('Not your notification');
        }
        if (!notification.isRead) {
            notification.isRead = true;
            await this.notifications.save(notification);
        }
    }
    async markAllRead(userId) {
        await this.notifications.update({ recipientId: userId, isRead: false }, { isRead: true });
    }
};
__decorate([
    OnEvent(NotificationEvents.CommentCreated),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "handleCommentCreated", null);
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
NotificationsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Notification)),
    __metadata("design:paramtypes", [Repository])
], NotificationsService);
export { NotificationsService };
//# sourceMappingURL=notifications.service.js.map