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
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, MoreThan, Not, Repository } from 'typeorm';
import { CommentsService } from '../comments/comments.service.js';
import { FollowsService } from '../follows/follows.service.js';
import { LikesService } from '../likes/likes.service.js';
import { PostMedia } from '../database/entities/post-media.entity.js';
import { PostTag } from '../database/entities/post-tag.entity.js';
import { extractHashtags } from '../common/hashtags.js';
import { Post, PostStatus } from '../database/entities/post.entity.js';
import { User, UserRole } from '../database/entities/user.entity.js';
import { NotificationEvents } from '../notifications/notification.events.js';
import { toPostResponse } from './post.mapper.js';
import { sameId } from '../common/same-id.js';
import { promptForDay } from '../prompts/daily-prompts.js';
import { localDay } from '../prompts/local-day.js';
const PAGE_SIZE = 20;
const MAX_PINNED = 3;
let PostsService = class PostsService {
    posts;
    postMedia;
    postTags;
    followsService;
    likesService;
    commentsService;
    events;
    users;
    config;
    constructor(posts, postMedia, postTags, followsService, likesService, commentsService, events, users, config) {
        this.posts = posts;
        this.postMedia = postMedia;
        this.postTags = postTags;
        this.followsService = followsService;
        this.likesService = likesService;
        this.commentsService = commentsService;
        this.events = events;
        this.users = users;
        this.config = config;
    }
    async isTrusted(userId) {
        const user = await this.users.findOne({
            where: { id: userId },
            select: { id: true, role: true },
        });
        if (!user)
            return false;
        if (user.role === UserRole.ADMIN || user.role === UserRole.SUPERVISOR)
            return true;
        const threshold = this.config.get('autoApproveAfter') ?? 3;
        if (threshold <= 0)
            return false;
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [approved, recentlyRejected] = await Promise.all([
            this.posts.countBy({ userId, status: PostStatus.APPROVED }),
            this.posts.countBy({
                userId,
                status: PostStatus.REJECTED,
                reviewedAt: MoreThan(since),
            }),
        ]);
        return approved >= threshold && recentlyRejected === 0;
    }
    async initialReview(userId) {
        return (await this.isTrusted(userId))
            ? {
                status: PostStatus.APPROVED,
                reviewedBy: null,
                reviewedAt: new Date(),
            }
            : { status: PostStatus.PENDING, reviewedBy: null, reviewedAt: null };
    }
    announceMentions(post) {
        if (post.status !== PostStatus.APPROVED)
            return;
        this.events.emit(NotificationEvents.MentionsPublished, {
            postId: post.id,
            actorId: post.userId,
            text: post.content,
            skipUserIds: [],
        });
    }
    announce(post) {
        this.announceMentions(post);
        if (post.status !== PostStatus.PENDING)
            return;
        this.events.emit(NotificationEvents.PendingPostsChanged);
        this.events.emit(NotificationEvents.PostSubmitted, {
            postId: post.id,
            authorId: post.userId,
        });
    }
    async create(userId, dto) {
        const promptDay = dto.answersPrompt
            ? localDay(new Date(), this.config.get('timeZone') ?? 'Asia/Karachi')
            : null;
        const post = await this.posts.save(this.posts.create({
            userId,
            content: dto.content,
            promptDay,
            promptText: promptDay ? promptForDay(promptDay) : null,
            isQuestion: dto.isQuestion ?? false,
            ...(await this.initialReview(userId)),
        }));
        await this.saveTags(post);
        if (dto.mediaUrls?.length) {
            await this.postMedia.save(dto.mediaUrls.map((url, index) => this.postMedia.create({ postId: post.id, url, sortOrder: index })));
        }
        this.announce(post);
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
            .andWhere('post.pinnedAt IS NULL')
            .andWhere('post.userId IN (:...authorIds)', { authorIds })
            .orderBy('post.createdAt', 'DESC')
            .take(PAGE_SIZE);
        if (cursor) {
            qb.andWhere('post.createdAt < :cursor', { cursor: new Date(cursor) });
        }
        const posts = await qb.getMany();
        if (!cursor && posts.length === 0)
            return this.findExplore(cursor, viewerId);
        const items = await this.attachEngagement(posts.map((p) => toPostResponse(p, viewerId)), viewerId);
        return {
            items,
            nextCursor: posts.length === PAGE_SIZE ? posts[posts.length - 1].createdAt.toISOString() : null,
        };
    }
    async findExplore(cursor, viewerId) {
        return this.page(this.approvedPosts().andWhere('post.pinnedAt IS NULL'), cursor, viewerId);
    }
    async findQuestions(cursor, viewerId) {
        return this.page(this.approvedPosts().andWhere('post.isQuestion = 1'), cursor, viewerId);
    }
    async findByTag(tag, cursor, viewerId) {
        const qb = this.approvedPosts().innerJoin(PostTag, 'pt', 'pt.post_id = post.id AND pt.tag = :tag', {
            tag: tag.toLowerCase(),
        });
        return this.page(qb, cursor, viewerId);
    }
    async search(query, viewerId) {
        const escaped = query.replace(/[\\%_]/g, (c) => `\\${c}`);
        const posts = await this.approvedPosts()
            .andWhere('post.content LIKE :q', { q: `%${escaped}%` })
            .take(PAGE_SIZE)
            .getMany();
        return this.attachEngagement(posts.map((p) => toPostResponse(p, viewerId)), viewerId);
    }
    async trendingTags(days = 7, limit = 10) {
        const rows = await this.postTags
            .createQueryBuilder('pt')
            .innerJoin(Post, 'post', 'post.id = pt.post_id')
            .select('pt.tag', 'tag')
            .addSelect('COUNT(*)', 'count')
            .where('post.status = :status', { status: PostStatus.APPROVED })
            .andWhere('post.createdAt >= :since', { since: new Date(Date.now() - days * 86_400_000) })
            .groupBy('pt.tag')
            .orderBy('count', 'DESC')
            .addOrderBy('pt.tag', 'ASC')
            .limit(limit)
            .getRawMany();
        return rows.map((r) => ({ tag: r.tag, count: Number(r.count) }));
    }
    approvedPosts() {
        return this.posts
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .leftJoinAndSelect('post.media', 'media')
            .where('post.status = :status', { status: PostStatus.APPROVED })
            .orderBy('post.createdAt', 'DESC');
    }
    async page(qb, cursor, viewerId) {
        if (cursor)
            qb.andWhere('post.createdAt < :cursor', { cursor: new Date(cursor) });
        const posts = await qb.take(PAGE_SIZE).getMany();
        const items = await this.attachEngagement(posts.map((p) => toPostResponse(p, viewerId)), viewerId);
        return {
            items,
            nextCursor: posts.length === PAGE_SIZE ? posts[posts.length - 1].createdAt.toISOString() : null,
        };
    }
    async saveTags(post) {
        await this.postTags.delete({ postId: post.id });
        const tags = extractHashtags(post.content);
        if (tags.length) {
            await this.postTags.insert(tags.map((tag) => ({ postId: post.id, tag })));
        }
    }
    async findByUser(userId, viewerId) {
        const qb = this.posts
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .leftJoinAndSelect('post.media', 'media')
            .where('post.userId = :userId', { userId })
            .orderBy('post.createdAt', 'DESC');
        if (!sameId(viewerId, userId)) {
            qb.andWhere('post.status = :status', { status: PostStatus.APPROVED });
        }
        const posts = await qb.getMany();
        return this.attachEngagement(posts.map((p) => toPostResponse(p, viewerId)), viewerId);
    }
    countByUser(userId) {
        return this.posts.countBy({ userId });
    }
    async getByIdOrFail(id, viewerId) {
        const post = await this.posts.findOne({
            where: { id },
            relations: { author: true, media: true },
        });
        if (!post)
            throw new NotFoundException('Post not found');
        if (post.status !== PostStatus.APPROVED && !sameId(post.userId, viewerId)) {
            throw new NotFoundException('Post not found');
        }
        const [withEngagement] = await this.attachEngagement([toPostResponse(post, viewerId)], viewerId);
        return withEngagement;
    }
    async updateOwn(id, userId, dto) {
        const post = await this.posts.findOneBy({ id });
        if (!post)
            throw new NotFoundException('Post not found');
        if (!sameId(post.userId, userId)) {
            throw new ForbiddenException('You can only edit your own posts');
        }
        post.content = dto.content;
        Object.assign(post, await this.initialReview(userId));
        await this.posts.save(post);
        await this.saveTags(post);
        if (dto.mediaUrls) {
            await this.postMedia.delete({ postId: id });
            if (dto.mediaUrls.length) {
                await this.postMedia.save(dto.mediaUrls.map((url, index) => this.postMedia.create({ postId: id, url, sortOrder: index })));
            }
        }
        this.announce(post);
        return this.getByIdOrFail(id, userId);
    }
    async delete(id, actor) {
        const post = await this.posts.findOneBy({ id });
        if (!post)
            throw new NotFoundException('Post not found');
        if (!sameId(post.userId, actor.id) && actor.role !== UserRole.ADMIN) {
            throw new ForbiddenException('You can only delete your own posts');
        }
        const wasPending = post.status === PostStatus.PENDING;
        await this.posts.remove(post);
        if (wasPending)
            this.events.emit(NotificationEvents.PendingPostsChanged);
    }
    async reviewStats() {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [pending, row] = await Promise.all([
            this.posts.countBy({ status: PostStatus.PENDING }),
            this.posts
                .createQueryBuilder('post')
                .select('AVG(TIMESTAMPDIFF(MINUTE, post.createdAt, post.reviewedAt))', 'avg')
                .addSelect('COUNT(*)', 'count')
                .where('post.reviewedBy IS NOT NULL')
                .andWhere('post.reviewedAt > :since', { since })
                .getRawOne(),
        ]);
        return {
            pending,
            avgWaitMinutes: row?.avg == null ? null : Math.round(Number(row.avg)),
            reviewed30d: Number(row?.count ?? 0),
        };
    }
    async findPinned(viewerId) {
        const posts = await this.posts.find({
            where: { status: PostStatus.APPROVED, pinnedAt: Not(IsNull()) },
            relations: { author: true, media: true },
            order: { pinnedAt: 'DESC' },
            take: MAX_PINNED,
        });
        return this.attachEngagement(posts.map((p) => toPostResponse(p, viewerId)), viewerId);
    }
    async setPinned(id, adminId, pinned, notifyAll = false) {
        const post = await this.posts.findOneBy({ id });
        if (!post || post.status !== PostStatus.APPROVED)
            throw new NotFoundException('Post not found');
        if (pinned) {
            const current = await this.posts.find({
                select: { id: true },
                where: { pinnedAt: Not(IsNull()), id: Not(id) },
                order: { pinnedAt: 'DESC' },
            });
            const unpin = current.slice(MAX_PINNED - 1).map((p) => p.id);
            if (unpin.length)
                await this.posts.update({ id: In(unpin) }, { pinnedAt: null });
        }
        await this.posts.update({ id }, { pinnedAt: pinned ? new Date() : null });
        if (pinned && notifyAll) {
            this.events.emit(NotificationEvents.AnnouncementPinned, { postId: id, adminId });
        }
        return this.getByIdOrFail(id, adminId);
    }
    async findPending() {
        const posts = await this.posts.find({
            where: { status: PostStatus.PENDING },
            relations: { author: true, media: true },
            order: { createdAt: 'ASC' },
        });
        return posts.map((p) => toPostResponse(p));
    }
    async approve(id, adminId) {
        return this.review(id, adminId, PostStatus.APPROVED);
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
        this.announceMentions(post);
        this.events.emit(NotificationEvents.PendingPostsChanged);
        return toPostResponse(post, post.userId);
    }
    async attachEngagement(items, viewerId) {
        if (items.length === 0)
            return items;
        const postIds = items.map((i) => Number(i.id));
        const [reactionCounts, commentCounts, myReactions, answered] = await Promise.all([
            this.likesService.countsByPostIds(postIds),
            this.commentsService.countsByPostIds(postIds),
            viewerId
                ? this.likesService.reactionsByUser(viewerId, postIds)
                : Promise.resolve(new Map()),
            this.commentsService.postIdsWithAcceptedAnswer(postIds),
        ]);
        const reactionMap = new Map();
        for (const row of reactionCounts) {
            const counts = reactionMap.get(Number(row.postId)) ?? {};
            counts[row.reaction] = Number(row.count);
            reactionMap.set(Number(row.postId), counts);
        }
        const commentMap = new Map(commentCounts.map((r) => [Number(r.postId), Number(r.count)]));
        return items.map((item) => {
            const reactions = reactionMap.get(Number(item.id)) ?? {};
            const myReaction = myReactions.get(Number(item.id)) ?? null;
            return {
                ...item,
                likeCount: Object.values(reactions).reduce((sum, n) => sum + n, 0),
                commentCount: commentMap.get(Number(item.id)) ?? 0,
                likedByMe: myReaction !== null,
                reactions,
                myReaction,
                answered: answered.has(Number(item.id)),
            };
        });
    }
};
PostsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Post)),
    __param(1, InjectRepository(PostMedia)),
    __param(2, InjectRepository(PostTag)),
    __param(7, InjectRepository(User)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        FollowsService,
        LikesService,
        CommentsService,
        EventEmitter2,
        Repository,
        ConfigService])
], PostsService);
export { PostsService };
//# sourceMappingURL=posts.service.js.map