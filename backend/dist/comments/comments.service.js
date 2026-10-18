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
import { BadRequestException, ForbiddenException, Injectable, NotFoundException, } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../database/entities/comment.entity.js';
import { Post, PostStatus } from '../database/entities/post.entity.js';
import { UserRole } from '../database/entities/user.entity.js';
import { NotificationEvents } from '../notifications/notification.events.js';
import { toCommentResponse } from './comment.mapper.js';
import { sameId } from '../common/same-id.js';
let CommentsService = class CommentsService {
    comments;
    posts;
    events;
    constructor(comments, posts, events) {
        this.comments = comments;
        this.posts = posts;
        this.events = events;
    }
    async create(postId, userId, dto) {
        const post = await this.posts.findOneBy({ id: postId });
        if (!post || post.status !== PostStatus.APPROVED) {
            throw new NotFoundException('Post not found');
        }
        let parent = null;
        if (dto.parentId != null) {
            parent = await this.comments.findOneBy({ id: dto.parentId, postId });
            if (!parent)
                throw new NotFoundException('Comment being replied to was not found');
        }
        const comment = await this.comments.save(this.comments.create({
            postId,
            userId,
            content: dto.content,
            parentId: parent?.id ?? null,
        }));
        const withAuthor = await this.comments.findOneOrFail({
            where: { id: comment.id },
            relations: { author: true },
        });
        this.events.emit(NotificationEvents.MentionsPublished, {
            postId,
            actorId: userId,
            text: dto.content,
            skipUserIds: [post.userId, ...(parent ? [parent.userId] : [])],
        });
        if (parent) {
            this.events.emit(NotificationEvents.ReplyCreated, {
                postId,
                parentCommentAuthorId: parent.userId,
                actorId: userId,
            });
        }
        if (!parent || !sameId(parent.userId, post.userId)) {
            this.events.emit(NotificationEvents.CommentCreated, {
                postId,
                postOwnerId: post.userId,
                actorId: userId,
            });
        }
        return toCommentResponse(withAuthor, userId);
    }
    async findByPost(postId, viewerId) {
        const post = await this.posts.findOneBy({ id: postId });
        if (!post || (post.status !== PostStatus.APPROVED && !sameId(post.userId, viewerId))) {
            throw new NotFoundException('Post not found');
        }
        const comments = await this.comments.find({
            where: { postId },
            relations: { author: true },
            order: { createdAt: 'ASC' },
        });
        return comments.map((c) => toCommentResponse(c, viewerId));
    }
    async remove(id, actor) {
        const comment = await this.comments.findOne({
            where: { id },
            relations: { post: true },
        });
        if (!comment)
            throw new NotFoundException('Comment not found');
        const allowed = sameId(comment.userId, actor.id) ||
            sameId(comment.post?.userId, actor.id) ||
            actor.role === UserRole.ADMIN;
        if (!allowed) {
            throw new ForbiddenException('You can only delete your own comments');
        }
        await this.comments.remove(comment);
    }
    async accept(id, actor) {
        const comment = await this.comments.findOne({ where: { id }, relations: { post: true } });
        if (!comment)
            throw new NotFoundException('Comment not found');
        if (!comment.post?.isQuestion)
            throw new BadRequestException('Only answers to a question can be accepted');
        if (!sameId(comment.post.userId, actor.id)) {
            throw new ForbiddenException('Only the person who asked can accept an answer');
        }
        const wasAccepted = comment.acceptedAt !== null;
        await this.comments.update({ postId: comment.postId }, { acceptedAt: null });
        if (!wasAccepted) {
            await this.comments.update({ id }, { acceptedAt: new Date() });
            this.events.emit(NotificationEvents.AnswerAccepted, {
                postId: comment.postId,
                answerAuthorId: comment.userId,
                actorId: actor.id,
            });
        }
        const updated = await this.comments.findOneOrFail({
            where: { id },
            relations: { author: true },
        });
        return toCommentResponse(updated, actor.id);
    }
    async postIdsWithAcceptedAnswer(postIds) {
        if (postIds.length === 0)
            return new Set();
        const rows = await this.comments
            .createQueryBuilder('comment')
            .select('DISTINCT comment.postId', 'postId')
            .where('comment.postId IN (:...postIds)', { postIds })
            .andWhere('comment.acceptedAt IS NOT NULL')
            .getRawMany();
        return new Set(rows.map((r) => Number(r.postId)));
    }
    countsByPostIds(postIds) {
        if (postIds.length === 0)
            return Promise.resolve([]);
        return this.comments
            .createQueryBuilder('comment')
            .select('comment.postId', 'postId')
            .addSelect('COUNT(*)', 'count')
            .where('comment.postId IN (:...postIds)', { postIds })
            .groupBy('comment.postId')
            .getRawMany();
    }
};
CommentsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Comment)),
    __param(1, InjectRepository(Post)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        EventEmitter2])
], CommentsService);
export { CommentsService };
//# sourceMappingURL=comments.service.js.map