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
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../database/entities/user.entity.js';
import { NotificationEvents, } from '../notifications/notification.events.js';
import { PushService } from './push.service.js';
let ReviewAlertsListener = class ReviewAlertsListener {
    users;
    push;
    constructor(users, push) {
        this.users = users;
        this.push = push;
    }
    async handlePostSubmitted({ authorId }) {
        const [admins, author] = await Promise.all([
            this.users.find({
                select: { id: true },
                where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE },
            }),
            this.users.findOne({
                select: { id: true, fullName: true },
                where: { id: authorId },
            }),
        ]);
        await Promise.all(admins.map((admin) => this.push.sendToUser(admin.id, {
            title: 'Post waiting for review',
            body: `${author?.fullName ?? 'A member'} shared a new post`,
            url: '/admin/review',
            tag: 'review-queue',
        })));
    }
};
__decorate([
    OnEvent(NotificationEvents.PostSubmitted),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReviewAlertsListener.prototype, "handlePostSubmitted", null);
ReviewAlertsListener = __decorate([
    Injectable(),
    __param(0, InjectRepository(User)),
    __metadata("design:paramtypes", [Repository,
        PushService])
], ReviewAlertsListener);
export { ReviewAlertsListener };
//# sourceMappingURL=review-alerts.listener.js.map