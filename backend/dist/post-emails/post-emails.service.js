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
var PostEmailsService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Post, PostStatus } from '../database/entities/post.entity.js';
import { PostEmailQueue, PostEmailStatus, } from '../database/entities/post-email-queue.entity.js';
import { User, UserStatus } from '../database/entities/user.entity.js';
import { digestTemplate } from '../mail/community-templates.js';
import { MailService } from '../mail/mail.service.js';
import { postExcerpt, postTitle } from './post-summary.js';
import { dedupeRecipients, TaskdeskRecipientsService, } from './taskdesk-recipients.service.js';
import { errorMessage, hourlyAllowance, sleep, toAbsoluteUrl, withAdvisoryLock, } from './email-worker-utils.js';
const WORKER_LOCK = 'dawoodtech_community_post_email_worker';
let PostEmailsService = PostEmailsService_1 = class PostEmailsService {
    posts;
    queue;
    users;
    dataSource;
    recipients;
    mail;
    config;
    logger = new Logger(PostEmailsService_1.name);
    constructor(posts, queue, users, dataSource, recipients, mail, config) {
        this.posts = posts;
        this.queue = queue;
        this.users = users;
        this.dataSource = dataSource;
        this.recipients = recipients;
        this.mail = mail;
        this.config = config;
    }
    get mode() {
        return this.config.get('postEmails.mode') ?? 'dry_run';
    }
    async eligibleRecipients() {
        const [interns, members] = await Promise.all([
            this.recipients.fetchRecipients(),
            this.users.find({
                select: { email: true, fullName: true },
                where: { status: UserStatus.ACTIVE, isEmailVerified: true },
            }),
        ]);
        return dedupeRecipients([
            ...interns,
            ...members.map((u) => ({ email: u.email, name: u.fullName })),
        ]);
    }
    toDigestPost(post) {
        const communityUrl = this.config.get('communityUrl');
        const apiUrl = this.config.get('apiPublicUrl');
        const firstImage = [...(post.media ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)[0];
        return {
            title: postTitle(post.content),
            authorName: post.author?.fullName ?? 'A community member',
            authorAvatarUrl: toAbsoluteUrl(apiUrl, post.author?.avatarUrl),
            excerpt: postExcerpt(post.content),
            imageUrl: toAbsoluteUrl(apiUrl, firstImage?.url),
            url: `${communityUrl}/post/${post.id}`,
        };
    }
    async sendDigest(posts, email, recipientName, date) {
        const communityUrl = this.config.get('communityUrl');
        const { subject, html, text } = digestTemplate({
            recipientName,
            recipientEmail: email,
            posts: posts.map((p) => this.toDigestPost(p)),
            communityUrl,
            logoUrl: `${communityUrl}/logo-full.png`,
            date,
        });
        await this.mail.send({ to: email, subject, html, text });
    }
    legacyQueuedCount() {
        return this.queue.countBy({ status: PostEmailStatus.QUEUED });
    }
    async processBatch() {
        if (!this.mail.isConfigured) {
            this.logger.warn('SMTP is not configured (MAIL_HOST) — not sending anything.');
            return null;
        }
        const result = await withAdvisoryLock(this.dataSource, WORKER_LOCK, () => this.sendQueued());
        if (!result)
            this.logger.log('Another post-email worker run is still in progress — skipping.');
        return result;
    }
    async sendQueued() {
        const batchSize = this.config.get('postEmails.batchSize') ?? 50;
        const delayMs = this.config.get('postEmails.delayMs') ?? 1000;
        const maxAttempts = this.config.get('postEmails.maxAttempts') ?? 3;
        const result = { sent: 0, failed: 0, retrying: 0, skipped: 0 };
        if ((await this.legacyQueuedCount()) === 0)
            return result;
        const allowance = await hourlyAllowance(this.dataSource, this.config.get('postEmails.hourlyLimit') ?? 20);
        if (allowance === 0) {
            this.logger.log('Hourly email limit reached — queued post emails wait for a later run.');
            return result;
        }
        const rows = await this.queue.find({
            where: { status: PostEmailStatus.QUEUED },
            order: { id: 'ASC' },
            take: Math.min(batchSize, allowance),
        });
        const postCache = new Map();
        for (const [index, row] of rows.entries()) {
            const postId = Number(row.postId);
            if (!postCache.has(postId)) {
                postCache.set(postId, await this.posts.findOne({ where: { id: postId }, relations: { author: true, media: true } }));
            }
            const post = postCache.get(postId);
            if (!post || post.status !== PostStatus.APPROVED) {
                row.status = PostEmailStatus.SKIPPED;
                row.error = 'Post no longer published';
                await this.queue.save(row);
                result.skipped++;
                continue;
            }
            row.attempts += 1;
            row.lastAttemptAt = new Date();
            try {
                await this.sendDigest([post], row.email, row.recipientName, post.reviewedAt ?? post.createdAt);
                row.status = PostEmailStatus.SENT;
                row.sentAt = new Date();
                row.error = null;
                result.sent++;
            }
            catch (err) {
                row.error = errorMessage(err).slice(0, 1000);
                if (row.attempts >= maxAttempts) {
                    row.status = PostEmailStatus.FAILED;
                    result.failed++;
                    this.logger.error(`Giving up on ${row.email} for post ${postId} after ${row.attempts} attempts: ${row.error}`);
                }
                else {
                    result.retrying++;
                    this.logger.warn(`Send to ${row.email} for post ${postId} failed (attempt ${row.attempts}): ${row.error}`);
                }
            }
            await this.queue.save(row);
            if (delayMs > 0 && index < rows.length - 1)
                await sleep(delayMs);
        }
        return result;
    }
};
PostEmailsService = PostEmailsService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(Post)),
    __param(1, InjectRepository(PostEmailQueue)),
    __param(2, InjectRepository(User)),
    __param(3, InjectDataSource()),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        DataSource,
        TaskdeskRecipientsService,
        MailService,
        ConfigService])
], PostEmailsService);
export { PostEmailsService };
//# sourceMappingURL=post-emails.service.js.map