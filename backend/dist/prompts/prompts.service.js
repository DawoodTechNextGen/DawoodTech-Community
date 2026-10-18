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
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Comment } from '../database/entities/comment.entity.js';
import { Post, PostStatus } from '../database/entities/post.entity.js';
import { promptForDay } from './daily-prompts.js';
import { localDay, previousDay } from './local-day.js';
const STREAK_WINDOW_DAYS = 120;
let PromptsService = class PromptsService {
    posts;
    comments;
    config;
    constructor(posts, comments, config) {
        this.posts = posts;
        this.comments = comments;
        this.config = config;
    }
    get timeZone() {
        return this.config.get('timeZone') ?? 'Asia/Karachi';
    }
    async today(userId) {
        const day = localDay(new Date(), this.timeZone);
        const [answered, answerCount, { streak, activeToday }] = await Promise.all([
            this.posts.existsBy({ userId, promptDay: day }),
            this.posts.countBy({ promptDay: day, status: PostStatus.APPROVED }),
            this.streak(userId, day),
        ]);
        return {
            day,
            prompt: promptForDay(day),
            answered,
            answerCount,
            streak,
            activeToday,
        };
    }
    async currentStreak(userId) {
        return (await this.streak(userId, localDay(new Date(), this.timeZone))).streak;
    }
    async streak(userId, today) {
        const since = new Date(Date.now() - STREAK_WINDOW_DAYS * 86_400_000);
        const [posts, comments] = await Promise.all([
            this.posts.find({
                select: { createdAt: true },
                where: { userId, createdAt: MoreThan(since) },
            }),
            this.comments.find({
                select: { createdAt: true },
                where: { userId, createdAt: MoreThan(since) },
            }),
        ]);
        const days = new Set([...posts, ...comments].map((r) => localDay(r.createdAt, this.timeZone)));
        const activeToday = days.has(today);
        let day = activeToday ? today : previousDay(today);
        let streak = 0;
        while (days.has(day)) {
            streak++;
            day = previousDay(day);
        }
        return { streak, activeToday };
    }
};
PromptsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Post)),
    __param(1, InjectRepository(Comment)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        ConfigService])
], PromptsService);
export { PromptsService };
//# sourceMappingURL=prompts.service.js.map