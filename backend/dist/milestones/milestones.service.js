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
import { Milestone, MilestoneKind } from '../database/entities/milestone.entity.js';
import { Post, PostStatus } from '../database/entities/post.entity.js';
import { User } from '../database/entities/user.entity.js';
import { NotificationEvents, } from '../notifications/notification.events.js';
let MilestonesService = class MilestonesService {
    milestones;
    posts;
    users;
    constructor(milestones, posts, users) {
        this.milestones = milestones;
        this.posts = posts;
        this.users = users;
    }
    async handleUserVerified({ userId }) {
        const user = await this.users.findOneBy({ id: userId });
        if (!user)
            return;
        await this.celebrate(`welcome:${user.id}`, MilestoneKind.JOINED, user, `👋 ${user.fullName} just joined DawoodTech Community! Say hi and help them feel at home.`);
    }
    async celebrate(sourceKey, kind, member, content) {
        const claimed = await this.milestones
            .createQueryBuilder()
            .insert()
            .into(Milestone)
            .values({ sourceKey, kind, userId: member.id })
            .orIgnore()
            .execute();
        if (!claimed.raw?.affectedRows)
            return false;
        const post = await this.posts.save(this.posts.create({
            userId: member.id,
            content,
            milestone: kind,
            status: PostStatus.APPROVED,
            reviewedAt: new Date(),
        }));
        await this.milestones.update({ sourceKey }, { postId: post.id });
        return true;
    }
};
__decorate([
    OnEvent(NotificationEvents.UserVerified),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MilestonesService.prototype, "handleUserVerified", null);
MilestonesService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Milestone)),
    __param(1, InjectRepository(Post)),
    __param(2, InjectRepository(User)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository])
], MilestonesService);
export { MilestonesService };
//# sourceMappingURL=milestones.service.js.map