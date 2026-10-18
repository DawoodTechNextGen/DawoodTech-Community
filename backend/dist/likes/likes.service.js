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
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Like, Reaction } from '../database/entities/like.entity.js';
import { Post, PostStatus } from '../database/entities/post.entity.js';
import { User, UserStatus } from '../database/entities/user.entity.js';
import { NotificationEvents } from '../notifications/notification.events.js';
import { toPublicUser } from '../users/user.mapper.js';
let LikesService = class LikesService {
    likes;
    posts;
    users;
    events;
    constructor(likes, posts, users, events) {
        this.likes = likes;
        this.posts = posts;
        this.users = users;
        this.events = events;
    }
    async like(postId, userId, reaction = Reaction.LIKE) {
        const post = await this.posts.findOneBy({ id: postId });
        if (!post || post.status !== PostStatus.APPROVED) {
            throw new NotFoundException('Post not found');
        }
        const existing = await this.likes.findOneBy({ postId, userId });
        if (existing) {
            if (existing.reaction !== reaction)
                await this.likes.update({ postId, userId }, { reaction });
            return;
        }
        await this.likes.save(this.likes.create({ postId, userId, reaction }));
        this.events.emit(NotificationEvents.LikeCreated, {
            postId,
            postOwnerId: post.userId,
            actorId: userId,
        });
    }
    async unlike(postId, userId) {
        await this.likes.delete({ postId, userId });
    }
    async listLikers(postId) {
        const rows = await this.likes.find({ where: { postId } });
        if (rows.length === 0)
            return [];
        const users = await this.users.find({
            where: { id: In(rows.map((r) => r.userId)), status: UserStatus.ACTIVE },
        });
        return users.map(toPublicUser);
    }
    countsByPostIds(postIds) {
        if (postIds.length === 0)
            return Promise.resolve([]);
        return this.likes
            .createQueryBuilder('like')
            .select('like.postId', 'postId')
            .addSelect('like.reaction', 'reaction')
            .addSelect('COUNT(*)', 'count')
            .where('like.postId IN (:...postIds)', { postIds })
            .groupBy('like.postId')
            .addGroupBy('like.reaction')
            .getRawMany();
    }
    async reactionsByUser(userId, postIds) {
        if (postIds.length === 0)
            return new Map();
        const rows = await this.likes.find({ where: { userId, postId: In(postIds) } });
        return new Map(rows.map((r) => [Number(r.postId), r.reaction]));
    }
};
LikesService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Like)),
    __param(1, InjectRepository(Post)),
    __param(2, InjectRepository(User)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        EventEmitter2])
], LikesService);
export { LikesService };
//# sourceMappingURL=likes.service.js.map