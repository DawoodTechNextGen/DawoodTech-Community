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
import { Repository } from 'typeorm';
import { Comment } from '../database/entities/comment.entity.js';
import { Post, PostStatus } from '../database/entities/post.entity.js';
import { NotificationEvents } from '../notifications/notification.events.js';
import { toCommentResponse } from './comment.mapper.js';
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
        const comment = await this.comments.save(this.comments.create({ postId, userId, content: dto.content }));
        const withAuthor = await this.comments.findOneOrFail({
            where: { id: comment.id },
            relations: { author: true },
        });
        this.events.emit(NotificationEvents.CommentCreated, {
            postId,
            postOwnerId: post.userId,
            actorId: userId,
        });
        return toCommentResponse(withAuthor, userId);
    }
    async findByPost(postId, viewerId) {
        const comments = await this.comments.find({
            where: { postId },
            relations: { author: true },
            order: { createdAt: 'ASC' },
        });
        return comments.map((c) => toCommentResponse(c, viewerId));
    }
    async remove(id, userId) {
        const comment = await this.comments.findOneBy({ id });
        if (!comment)
            throw new NotFoundException('Comment not found');
        if (comment.userId !== userId) {
            throw new ForbiddenException('You can only delete your own comments');
        }
        await this.comments.remove(comment);
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