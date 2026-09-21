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
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Follow } from '../database/entities/follow.entity.js';
import { User } from '../database/entities/user.entity.js';
import { NotificationEvents } from '../notifications/notification.events.js';
import { toPublicUser } from '../users/user.mapper.js';
let FollowsService = class FollowsService {
    follows;
    users;
    events;
    constructor(follows, users, events) {
        this.follows = follows;
        this.users = users;
        this.events = events;
    }
    async follow(followerId, followingId) {
        if (followerId === followingId) {
            throw new BadRequestException('You cannot follow yourself');
        }
        const target = await this.users.findOneBy({ id: followingId });
        if (!target)
            throw new NotFoundException('User not found');
        const existing = await this.follows.findOneBy({ followerId, followingId });
        if (existing)
            return;
        await this.follows.save(this.follows.create({ followerId, followingId }));
        this.events.emit(NotificationEvents.FollowCreated, { followingId, followerId });
    }
    async unfollow(followerId, followingId) {
        await this.follows.delete({ followerId, followingId });
    }
    async isFollowing(followerId, followingId) {
        const existing = await this.follows.findOneBy({ followerId, followingId });
        return !!existing;
    }
    async getFollowedIds(followerId) {
        const rows = await this.follows.find({ where: { followerId } });
        return rows.map((r) => r.followingId);
    }
    async listFollowers(userId) {
        const rows = await this.follows.find({ where: { followingId: userId } });
        if (rows.length === 0)
            return [];
        const users = await this.users.find({
            where: { id: In(rows.map((r) => r.followerId)) },
        });
        return users.map(toPublicUser);
    }
    async listFollowing(userId) {
        const rows = await this.follows.find({ where: { followerId: userId } });
        if (rows.length === 0)
            return [];
        const users = await this.users.find({
            where: { id: In(rows.map((r) => r.followingId)) },
        });
        return users.map(toPublicUser);
    }
};
FollowsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Follow)),
    __param(1, InjectRepository(User)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        EventEmitter2])
], FollowsService);
export { FollowsService };
//# sourceMappingURL=follows.service.js.map