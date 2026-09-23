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
import { OnEvent } from '@nestjs/event-emitter';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Post, PostStatus } from '../database/entities/post.entity.js';
import { PostEmailQueue, PostEmailStatus, } from '../database/entities/post-email-queue.entity.js';
import { User, UserStatus } from '../database/entities/user.entity.js';
import { newPostTemplate } from '../mail/community-templates.js';
import { MailService } from '../mail/mail.service.js';
import { PostEmailEvents } from './post-email.events.js';
import { postExcerpt, postTitle } from './post-summary.js';
import { dedupeRecipients, TaskdeskRecipientsService, } from './taskdesk-recipients.service.js';
import { errorMessage, normalizeEmail, sleep, toAbsoluteUrl, withAdvisoryLock, } from './email-worker-utils.js';
const INSERT_CHUNK = 500;
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
    async handlePostPublished({ postId }) {
        try {
            await this.enqueueForPost(postId);
        }
        catch (err) {
            this.logger.error(`Couldn't queue emails for post ${postId}: ${errorMessage(err)}`);
        }
    }
    async enqueueForPost(postId) {
        const mode = this.mode;
        if (mode === 'test') {
            const testRecipient = this.config.get('postEmails.testRecipient');
            if (!testRecipient) {
                this.logger.warn('POST_EMAIL_MODE=test but POST_EMAIL_TEST_RECIPIENT is empty');
                return;
            }
            const added = await this.insertQueueRows(postId, [
                { email: normalizeEmail(testRecipient), name: null },
            ]);
            this.logger.log(`[test] Post ${postId}: queued ${added} email to ${testRecipient}`);
            return;
        }
        if (mode === 'dry_run') {
            const recipients = await this.eligibleRecipients(postId);
            this.logger.log(`[dry_run] Post ${postId} would be emailed to ${recipients.length} recipients:\n` +
                recipients.map((r) => `  ${r.email}${r.name ? ` (${r.name})` : ''}`).join('\n'));
            return;
        }
        const claim = await this.posts.update({ id: postId, notifiedAt: IsNull(), status: PostStatus.APPROVED }, { notifiedAt: new Date() });
        if (!claim.affected)
            return;
        try {
            const recipients = await this.eligibleRecipients(postId);
            const added = await this.insertQueueRows(postId, recipients);
            this.logger.log(`Post ${postId}: queued ${added} emails`);
        }
        catch (err) {
            await this.posts.update({ id: postId }, { notifiedAt: null });
            throw err;
        }
    }
    async eligibleRecipients(postId) {
        const [interns, members, post] = await Promise.all([
            this.recipients.fetchRecipients(),
            this.users.find({
                select: { email: true, fullName: true },
                where: { status: UserStatus.ACTIVE, isEmailVerified: true },
            }),
            postId ? this.posts.findOne({ where: { id: postId }, relations: { author: true } }) : null,
        ]);
        const authorEmail = post?.author ? normalizeEmail(post.author.email) : null;
        return dedupeRecipients([
            ...interns,
            ...members.map((u) => ({ email: u.email, name: u.fullName })),
        ]).filter((r) => r.email !== authorEmail);
    }
    async insertQueueRows(postId, recipients) {
        let added = 0;
        for (let i = 0; i < recipients.length; i += INSERT_CHUNK) {
            const result = await this.queue
                .createQueryBuilder()
                .insert()
                .into(PostEmailQueue)
                .values(recipients.slice(i, i + INSERT_CHUNK).map((r) => ({
                postId,
                email: r.email,
                recipientName: r.name,
                status: PostEmailStatus.QUEUED,
            })))
                .orIgnore()
                .updateEntity(false)
                .execute();
            added += result.raw.affectedRows ?? 0;
        }
        return added;
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
        const rows = await this.queue.find({
            where: { status: PostEmailStatus.QUEUED },
            order: { id: 'ASC' },
            take: batchSize,
        });
        if (rows.length === 0)
            return result;
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
                await this.sendForPost(post, row.email, row.recipientName);
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
    async sendForPost(post, email, recipientName) {
        const communityUrl = this.config.get('communityUrl');
        const apiUrl = this.config.get('apiPublicUrl');
        const absolute = (url) => toAbsoluteUrl(apiUrl, url);
        const firstImage = [...(post.media ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)[0];
        const { subject, html, text } = newPostTemplate({
            recipientName,
            recipientEmail: email,
            title: postTitle(post.content),
            authorName: post.author?.fullName ?? 'A community member',
            authorAvatarUrl: absolute(post.author?.avatarUrl),
            excerpt: postExcerpt(post.content),
            imageUrl: absolute(firstImage?.url),
            postUrl: `${communityUrl}/post/${post.id}`,
            communityUrl,
            logoUrl: `${communityUrl}/logo-full.png`,
            date: post.reviewedAt ?? post.createdAt,
        });
        await this.mail.send({ to: email, subject, html, text });
    }
    async stats(limit = 50) {
        const rows = (await this.queue
            .createQueryBuilder('q')
            .innerJoin('q.post', 'post')
            .select('q.postId', 'postId')
            .addSelect('post.content', 'content')
            .addSelect('post.notifiedAt', 'notifiedAt')
            .addSelect(`SUM(q.status = '${PostEmailStatus.QUEUED}')`, 'queued')
            .addSelect(`SUM(q.status = '${PostEmailStatus.SENT}')`, 'sent')
            .addSelect(`SUM(q.status = '${PostEmailStatus.FAILED}')`, 'failed')
            .addSelect(`SUM(q.status = '${PostEmailStatus.SKIPPED}')`, 'skipped')
            .groupBy('q.postId')
            .addGroupBy('post.content')
            .addGroupBy('post.notifiedAt')
            .orderBy('q.postId', 'DESC')
            .limit(limit)
            .getRawMany());
        return {
            mode: this.mode,
            posts: rows.map((r) => ({
                postId: Number(r.postId),
                title: postTitle(r.content),
                notifiedAt: r.notifiedAt ? new Date(r.notifiedAt).toISOString() : null,
                queued: Number(r.queued),
                sent: Number(r.sent),
                failed: Number(r.failed),
                skipped: Number(r.skipped),
            })),
        };
    }
};
__decorate([
    OnEvent(PostEmailEvents.PostPublished),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PostEmailsService.prototype, "handlePostPublished", null);
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