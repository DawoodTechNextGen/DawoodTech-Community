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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CommentsService } from '../comments/comments.service.js';
import { FollowsService } from '../follows/follows.service.js';
import { LikesService } from '../likes/likes.service.js';
import { PostMedia } from '../database/entities/post-media.entity.js';
import { Post, PostStatus } from '../database/entities/post.entity.js';
import { NotificationEvents } from '../notifications/notification.events.js';
import { toPostResponse } from './post.mapper.js';
const PAGE_SIZE = 20;
let PostsService = class PostsService {
    posts;
    postMedia;
    followsService;
    likesService;
    commentsService;
    events;
    constructor(posts, postMedia, followsService, likesService, commentsService, events) {
        this.posts = posts;
        this.postMedia = postMedia;
        this.followsService = followsService;
        this.likesService = likesService;
        this.commentsService = commentsService;
        this.events = events;
    }
    async create(userId, dto) {
        const post = await this.posts.save(this.posts.create({
            userId,
            content: dto.content,
            status: PostStatus.PENDING,
        }));
        if (dto.mediaUrls?.length) {
            await this.postMedia.save(dto.mediaUrls.map((url, index) => this.postMedia.create({ postId: post.id, url, sortOrder: index })));
        }
        return this.getByIdOrFail(post.id, userId);
    }
    async findFeed(cursor, viewerId) {
        if (!viewerId)
            return this.findExplore(cursor, viewerId);
        const followedIds = await this.followsService.getFollowedIds(viewerId);
        if (followedIds.length === 0)
            return this.findExplore(cursor, viewerId);
        const authorIds = [...followedIds, viewerId];
        const qb = this.posts
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .leftJoinAndSelect('post.media', 'media')
            .where('post.status = :status', { status: PostStatus.APPROVED })
            .andWhere('post.userId IN (:...authorIds)', { authorIds })
            .orderBy('post.createdAt', 'DESC')
            .take(PAGE_SIZE);
        if (cursor) {
            qb.andWhere('post.createdAt < :cursor', { cursor: new Date(cursor) });
        }
        const posts = await qb.getMany();
        const items = await this.attachEngagement(posts.map((p) => toPostResponse(p, viewerId)), viewerId);
        return {
            items,
            nextCursor: posts.length === PAGE_SIZE
                ? posts[posts.length - 1].createdAt.toISOString()
                : null,
        };
    }
    async findExplore(cursor, viewerId) {
        const qb = this.posts
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .leftJoinAndSelect('post.media', 'media')
            .where('post.status = :status', { status: PostStatus.APPROVED })
            .orderBy('post.createdAt', 'DESC')
            .take(PAGE_SIZE);
        if (cursor) {
            qb.andWhere('post.createdAt < :cursor', { cursor: new Date(cursor) });
        }
        const posts = await qb.getMany();
        const items = await this.attachEngagement(posts.map((p) => toPostResponse(p, viewerId)), viewerId);
        return {
            items,
            nextCursor: posts.length === PAGE_SIZE
                ? posts[posts.length - 1].createdAt.toISOString()
                : null,
        };
    }
    async findByUser(userId, viewerId) {
        const qb = this.posts
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .leftJoinAndSelect('post.media', 'media')
            .where('post.userId = :userId', { userId })
            .orderBy('post.createdAt', 'DESC');
        if (viewerId !== userId) {
            qb.andWhere('post.status = :status', { status: PostStatus.APPROVED });
        }
        const posts = await qb.getMany();
        return this.attachEngagement(posts.map((p) => toPostResponse(p, viewerId)), viewerId);
    }
    async getByIdOrFail(id, viewerId) {
        const post = await this.posts.findOne({
            where: { id },
            relations: { author: true, media: true },
        });
        if (!post)
            throw new NotFoundException('Post not found');
        if (post.status !== PostStatus.APPROVED && post.userId !== viewerId) {
            throw new NotFoundException('Post not found');
        }
        const [withEngagement] = await this.attachEngagement([toPostResponse(post, viewerId)], viewerId);
        return withEngagement;
    }
    async updateOwn(id, userId, dto) {
        const post = await this.posts.findOneBy({ id });
        if (!post)
            throw new NotFoundException('Post not found');
        if (post.userId !== userId) {
            throw new ForbiddenException('You can only edit your own posts');
        }
        post.content = dto.content;
        post.status = PostStatus.PENDING;
        post.reviewedBy = null;
        post.reviewedAt = null;
        await this.posts.save(post);
        if (dto.mediaUrls) {
            await this.postMedia.delete({ postId: id });
            if (dto.mediaUrls.length) {
                await this.postMedia.save(dto.mediaUrls.map((url, index) => this.postMedia.create({ postId: id, url, sortOrder: index })));
            }
        }
        return this.getByIdOrFail(id, userId);
    }
    async deleteOwn(id, userId) {
        const post = await this.posts.findOneBy({ id });
        if (!post)
            throw new NotFoundException('Post not found');
        if (post.userId !== userId) {
            throw new ForbiddenException('You can only delete your own posts');
        }
        await this.posts.remove(post);
    }
    async findPending() {
        const posts = await this.posts.find({
            where: { status: PostStatus.PENDING },
            relations: { author: true, media: true },
            order: { createdAt: 'ASC' },
        });
        return posts.map((p) => toPostResponse(p));
    }
    async approve(id, adminId, notifyInterns = true) {
        const response = await this.review(id, adminId, PostStatus.APPROVED);
        await this.posts.update({ id, notifiedAt: IsNull() }, { notifyByEmail: notifyInterns });
        return response;
    }
    async reject(id, adminId) {
        return this.review(id, adminId, PostStatus.REJECTED);
    }
    async review(id, adminId, status) {
        const post = await this.posts.findOne({
            where: { id },
            relations: { author: true, media: true },
        });
        if (!post)
            throw new NotFoundException('Post not found');
        post.status = status;
        post.reviewedBy = adminId;
        post.reviewedAt = new Date();
        await this.posts.save(post);
        this.events.emit(status === PostStatus.APPROVED
            ? NotificationEvents.PostApproved
            : NotificationEvents.PostRejected, { postId: post.id, authorId: post.userId, adminId });
        return toPostResponse(post, post.userId);
    }
    async attachEngagement(items, viewerId) {
        if (items.length === 0)
            return items;
        const postIds = items.map((i) => Number(i.id));
        const [likeCounts, commentCounts, likedIds] = await Promise.all([
            this.likesService.countsByPostIds(postIds),
            this.commentsService.countsByPostIds(postIds),
            viewerId
                ? this.likesService.likedPostIdsByUser(viewerId, postIds)
                : Promise.resolve(new Set()),
        ]);
        const likeMap = new Map(likeCounts.map((r) => [Number(r.postId), Number(r.count)]));
        const commentMap = new Map(commentCounts.map((r) => [Number(r.postId), Number(r.count)]));
        return items.map((item) => ({
            ...item,
            likeCount: likeMap.get(Number(item.id)) ?? 0,
            commentCount: commentMap.get(Number(item.id)) ?? 0,
            likedByMe: likedIds.has(Number(item.id)),
        }));
    }
};
PostsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Post)),
    __param(1, InjectRepository(PostMedia)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        FollowsService,
        LikesService,
        CommentsService,
        EventEmitter2])
], PostsService);
export { PostsService };
//# sourceMappingURL=posts.service.js.map