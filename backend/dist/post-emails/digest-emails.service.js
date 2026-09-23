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
var DigestEmailsService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { DigestEmailQueue } from '../database/entities/digest-email-queue.entity.js';
import { EmailDigest } from '../database/entities/email-digest.entity.js';
import { Post, PostStatus } from '../database/entities/post.entity.js';
import { PostEmailStatus } from '../database/entities/post-email-queue.entity.js';
import { MailService } from '../mail/mail.service.js';
import { localDayAndHour } from './digest-schedule.js';
import { errorMessage, hourlyAllowance, normalizeEmail, sleep, withAdvisoryLock, } from './email-worker-utils.js';
import { postTitle } from './post-summary.js';
import { PostEmailsService, } from './post-emails.service.js';
const BUILD_LOCK = 'dawoodtech_community_digest_build';
const WORKER_LOCK = 'dawoodtech_community_digest_worker';
const INSERT_CHUNK = 500;
let DigestEmailsService = DigestEmailsService_1 = class DigestEmailsService {
    posts;
    digests;
    queue;
    dataSource;
    postEmails;
    mail;
    config;
    logger = new Logger(DigestEmailsService_1.name);
    constructor(posts, digests, queue, dataSource, postEmails, mail, config) {
        this.posts = posts;
        this.digests = digests;
        this.queue = queue;
        this.dataSource = dataSource;
        this.postEmails = postEmails;
        this.mail = mail;
        this.config = config;
    }
    get digestHour() {
        return this.config.get('postEmails.digestHour') ?? 9;
    }
    get timeZone() {
        return this.config.get('postEmails.digestTimeZone') ?? 'Asia/Karachi';
    }
    pendingPosts() {
        return this.posts.find({
            where: { status: PostStatus.APPROVED, notifyByEmail: true, notifiedAt: IsNull() },
            relations: { author: true, media: true },
            order: { reviewedAt: 'ASC', id: 'ASC' },
        });
    }
    async buildDueDigest(force = false) {
        const { day, hour } = localDayAndHour(new Date(), this.timeZone);
        if (!force && hour < this.digestHour)
            return;
        if (await this.digests.findOneBy({ digestKey: day }))
            return;
        const built = await withAdvisoryLock(this.dataSource, BUILD_LOCK, () => this.build(day));
        if (built === null)
            this.logger.log('Another run is already building the digest — skipping.');
    }
    async build(day) {
        if (await this.digests.findOneBy({ digestKey: day }))
            return;
        const posts = await this.pendingPosts();
        const postIds = posts.map((p) => Number(p.id));
        const mode = this.postEmails.mode;
        if (postIds.length === 0) {
            await this.digests.save(this.digests.create({ digestKey: day, postIds: [] }));
            this.logger.log(`Digest ${day}: no new posts today.`);
            return;
        }
        let recipients;
        if (mode === 'test') {
            const testRecipient = normalizeEmail(this.config.get('postEmails.testRecipient') ?? '');
            if (!testRecipient) {
                this.logger.warn('POST_EMAIL_MODE=test but POST_EMAIL_TEST_RECIPIENT is empty');
                return;
            }
            recipients = [{ email: testRecipient, name: null }];
        }
        else {
            recipients = await this.postEmails.eligibleRecipients();
        }
        if (mode === 'dry_run') {
            await this.digests.save(this.digests.create({ digestKey: day, postIds }));
            this.logger.log(`[dry_run] Digest ${day} with ${postIds.length} post(s) would go to ${recipients.length} recipients:\n` +
                recipients.map((r) => `  ${r.email}${r.name ? ` (${r.name})` : ''}`).join('\n'));
            return;
        }
        await this.dataSource.transaction(async (manager) => {
            const digest = await manager.save(manager.create(EmailDigest, { digestKey: day, postIds }));
            if (mode === 'live') {
                await manager.update(Post, { id: In(postIds), notifiedAt: IsNull() }, { notifiedAt: new Date() });
            }
            for (let i = 0; i < recipients.length; i += INSERT_CHUNK) {
                await manager
                    .createQueryBuilder()
                    .insert()
                    .into(DigestEmailQueue)
                    .values(recipients.slice(i, i + INSERT_CHUNK).map((r) => ({
                    digestId: digest.id,
                    email: r.email,
                    recipientName: r.name,
                    status: PostEmailStatus.QUEUED,
                })))
                    .orIgnore()
                    .updateEntity(false)
                    .execute();
            }
        });
        this.logger.log(`${mode === 'test' ? '[test] ' : ''}Digest ${day}: ${postIds.length} post(s), ` +
            `queued for ${recipients.length} recipient(s).`);
    }
    async processBatch() {
        if (!this.mail.isConfigured)
            return null;
        const result = await withAdvisoryLock(this.dataSource, WORKER_LOCK, () => this.sendQueued());
        if (!result)
            this.logger.log('Another digest worker run is still in progress — skipping.');
        return result;
    }
    async sendQueued() {
        const batchSize = this.config.get('postEmails.batchSize') ?? 50;
        const delayMs = this.config.get('postEmails.delayMs') ?? 1000;
        const maxAttempts = this.config.get('postEmails.maxAttempts') ?? 3;
        const result = { sent: 0, failed: 0, retrying: 0, skipped: 0 };
        if ((await this.queue.countBy({ status: PostEmailStatus.QUEUED })) === 0)
            return result;
        const allowance = await hourlyAllowance(this.dataSource, this.config.get('postEmails.hourlyLimit') ?? 20);
        if (allowance === 0) {
            this.logger.log('Hourly email limit reached — digest emails wait for a later run.');
            return result;
        }
        const rows = await this.queue.find({
            where: { status: PostEmailStatus.QUEUED },
            order: { id: 'ASC' },
            take: Math.min(batchSize, allowance),
        });
        const digestPosts = new Map();
        for (const [index, row] of rows.entries()) {
            const digestId = Number(row.digestId);
            if (!digestPosts.has(digestId)) {
                const digest = await this.digests.findOneBy({ id: digestId });
                const ids = digest?.postIds ?? [];
                const found = ids.length
                    ? await this.posts.find({
                        where: { id: In(ids), status: PostStatus.APPROVED },
                        relations: { author: true, media: true },
                    })
                    : [];
                const byId = new Map(found.map((p) => [Number(p.id), p]));
                digestPosts.set(digestId, {
                    posts: ids.flatMap((id) => byId.get(Number(id)) ?? []),
                    date: digest?.createdAt ?? new Date(),
                });
            }
            const { posts, date } = digestPosts.get(digestId);
            if (posts.length === 0) {
                row.status = PostEmailStatus.SKIPPED;
                row.error = 'Posts no longer published';
                await this.queue.save(row);
                result.skipped++;
                continue;
            }
            row.attempts += 1;
            row.lastAttemptAt = new Date();
            try {
                await this.postEmails.sendDigest(posts, row.email, row.recipientName, date);
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
                    this.logger.error(`Giving up on digest ${digestId} to ${row.email} after ${row.attempts} attempts: ${row.error}`);
                }
                else {
                    result.retrying++;
                    this.logger.warn(`Digest ${digestId} to ${row.email} failed (attempt ${row.attempts}): ${row.error}`);
                }
            }
            await this.queue.save(row);
            if (delayMs > 0 && index < rows.length - 1)
                await sleep(delayMs);
        }
        return result;
    }
    async stats(limit = 14) {
        const [pending, legacyQueued, rows] = await Promise.all([
            this.pendingPosts(),
            this.postEmails.legacyQueuedCount(),
            this.dataSource.query(`SELECT d.id, d.digest_key AS day, d.post_ids AS postIds,
                COALESCE(SUM(q.status = 'queued'), 0) AS queued,
                COALESCE(SUM(q.status = 'sent'), 0) AS sent,
                COALESCE(SUM(q.status = 'failed'), 0) AS failed,
                COALESCE(SUM(q.status = 'skipped'), 0) AS skipped
         FROM email_digests d
         LEFT JOIN digest_email_queue q ON q.digest_id = d.id
         WHERE d.post_ids <> '[]'
         GROUP BY d.id, d.digest_key, d.post_ids
         ORDER BY d.id DESC
         LIMIT ?`, [limit]),
        ]);
        return {
            mode: this.postEmails.mode,
            digestHour: this.digestHour,
            timeZone: this.timeZone,
            pendingPosts: pending.map((p) => ({ postId: Number(p.id), title: postTitle(p.content) })),
            legacyQueued,
            digests: rows.map((r) => ({
                id: Number(r.id),
                day: r.day,
                postCount: JSON.parse(r.postIds).length,
                queued: Number(r.queued),
                sent: Number(r.sent),
                failed: Number(r.failed),
                skipped: Number(r.skipped),
            })),
        };
    }
};
DigestEmailsService = DigestEmailsService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(Post)),
    __param(1, InjectRepository(EmailDigest)),
    __param(2, InjectRepository(DigestEmailQueue)),
    __param(3, InjectDataSource()),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        DataSource,
        PostEmailsService,
        MailService,
        ConfigService])
], DigestEmailsService);
export { DigestEmailsService };
//# sourceMappingURL=digest-emails.service.js.map