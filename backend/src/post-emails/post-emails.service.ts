import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Post, PostStatus } from '../database/entities/post.entity.js';
import {
  PostEmailQueue,
  PostEmailStatus,
} from '../database/entities/post-email-queue.entity.js';
import { User, UserStatus } from '../database/entities/user.entity.js';
import { digestTemplate, type DigestPost } from '../mail/community-templates.js';
import { MailService } from '../mail/mail.service.js';
import { postExcerpt, postTitle } from './post-summary.js';
import {
  dedupeRecipients,
  TaskdeskRecipientsService,
  type Recipient,
} from './taskdesk-recipients.service.js';
import {
  errorMessage,
  hourlyAllowance,
  sleep,
  toAbsoluteUrl,
  withAdvisoryLock,
} from './email-worker-utils.js';

export type PostEmailMode = 'live' | 'test' | 'dry_run';

const WORKER_LOCK = 'dawoodtech_community_post_email_worker';

export interface WorkerRunResult {
  sent: number;
  failed: number;
  retrying: number;
  skipped: number;
}

/**
 * Who gets new-post emails, and how a post is rendered for them. New posts go
 * out in the daily digest (DigestEmailsService); the worker here only drains
 * the older one-email-per-post queue (post_email_queue) left from before that.
 */
@Injectable()
export class PostEmailsService {
  private readonly logger = new Logger(PostEmailsService.name);

  constructor(
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(PostEmailQueue)
    private readonly queue: Repository<PostEmailQueue>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly recipients: TaskdeskRecipientsService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  get mode(): PostEmailMode {
    return this.config.get<PostEmailMode>('postEmails.mode') ?? 'dry_run';
  }

  /** TaskDesk interns plus active, verified community members — one entry per address. */
  async eligibleRecipients(): Promise<Recipient[]> {
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

  /** A post (loaded with author + media) as a digest entry. */
  toDigestPost(post: Post): DigestPost {
    const communityUrl = this.config.get<string>('communityUrl')!;
    const apiUrl = this.config.get<string>('apiPublicUrl')!;
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

  /** Renders and sends a digest of `posts` (oldest first) to one address. */
  async sendDigest(
    posts: Post[],
    email: string,
    recipientName: string | null,
    date: Date,
  ): Promise<void> {
    const communityUrl = this.config.get<string>('communityUrl')!;
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

  /** Queued emails left in the older one-email-per-post queue. */
  legacyQueuedCount(): Promise<number> {
    return this.queue.countBy({ status: PostEmailStatus.QUEUED });
  }

  // --- Worker for the older per-post queue (driven by the cron CLI) ---

  async processBatch(): Promise<WorkerRunResult | null> {
    if (!this.mail.isConfigured) {
      this.logger.warn('SMTP is not configured (MAIL_HOST) — not sending anything.');
      return null;
    }

    const result = await withAdvisoryLock(this.dataSource, WORKER_LOCK, () =>
      this.sendQueued(),
    );
    if (!result) this.logger.log('Another post-email worker run is still in progress — skipping.');
    return result;
  }

  private async sendQueued(): Promise<WorkerRunResult> {
    const batchSize = this.config.get<number>('postEmails.batchSize') ?? 50;
    const delayMs = this.config.get<number>('postEmails.delayMs') ?? 1000;
    const maxAttempts = this.config.get<number>('postEmails.maxAttempts') ?? 3;
    const result: WorkerRunResult = { sent: 0, failed: 0, retrying: 0, skipped: 0 };

    if ((await this.legacyQueuedCount()) === 0) return result;

    const allowance = await hourlyAllowance(
      this.dataSource,
      this.config.get<number>('postEmails.hourlyLimit') ?? 20,
    );
    if (allowance === 0) {
      this.logger.log('Hourly email limit reached — queued post emails wait for a later run.');
      return result;
    }

    const rows = await this.queue.find({
      where: { status: PostEmailStatus.QUEUED },
      order: { id: 'ASC' },
      take: Math.min(batchSize, allowance),
    });

    const postCache = new Map<number, Post | null>();

    for (const [index, row] of rows.entries()) {
      const postId = Number(row.postId);
      if (!postCache.has(postId)) {
        postCache.set(
          postId,
          await this.posts.findOne({ where: { id: postId }, relations: { author: true, media: true } }),
        );
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
      } catch (err) {
        row.error = errorMessage(err).slice(0, 1000);
        if (row.attempts >= maxAttempts) {
          row.status = PostEmailStatus.FAILED;
          result.failed++;
          this.logger.error(
            `Giving up on ${row.email} for post ${postId} after ${row.attempts} attempts: ${row.error}`,
          );
        } else {
          result.retrying++;
          this.logger.warn(
            `Send to ${row.email} for post ${postId} failed (attempt ${row.attempts}): ${row.error}`,
          );
        }
      }
      await this.queue.save(row);

      if (delayMs > 0 && index < rows.length - 1) await sleep(delayMs);
    }

    return result;
  }
}
