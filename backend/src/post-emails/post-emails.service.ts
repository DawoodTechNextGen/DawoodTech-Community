import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Post, PostStatus } from '../database/entities/post.entity.js';
import {
  PostEmailQueue,
  PostEmailStatus,
} from '../database/entities/post-email-queue.entity.js';
import { newPostTemplate } from '../mail/community-templates.js';
import { MailService } from '../mail/mail.service.js';
import { PostEmailEvents, type PostPublishedEvent } from './post-email.events.js';
import { postExcerpt, postTitle } from './post-summary.js';
import { TaskdeskRecipientsService, type Recipient } from './taskdesk-recipients.service.js';
import {
  errorMessage,
  normalizeEmail,
  sleep,
  toAbsoluteUrl,
  withAdvisoryLock,
} from './email-worker-utils.js';

export type PostEmailMode = 'live' | 'test' | 'dry_run';

const INSERT_CHUNK = 500;
const WORKER_LOCK = 'dawoodtech_community_post_email_worker';

export interface PostEmailStats {
  postId: number;
  title: string;
  notifiedAt: string | null;
  queued: number;
  sent: number;
  failed: number;
  skipped: number;
}

export interface WorkerRunResult {
  sent: number;
  failed: number;
  retrying: number;
  skipped: number;
}

@Injectable()
export class PostEmailsService {
  private readonly logger = new Logger(PostEmailsService.name);

  constructor(
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(PostEmailQueue)
    private readonly queue: Repository<PostEmailQueue>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly recipients: TaskdeskRecipientsService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  get mode(): PostEmailMode {
    return this.config.get<PostEmailMode>('postEmails.mode') ?? 'dry_run';
  }

  // --- Enqueue (runs off the approve request, via the event emitter) ---

  @OnEvent(PostEmailEvents.PostPublished)
  async handlePostPublished({ postId }: PostPublishedEvent): Promise<void> {
    try {
      await this.enqueueForPost(postId);
    } catch (err) {
      this.logger.error(`Couldn't queue emails for post ${postId}: ${errorMessage(err)}`);
    }
  }

  async enqueueForPost(postId: number): Promise<void> {
    const mode = this.mode;

    if (mode === 'test') {
      const testRecipient = this.config.get<string>('postEmails.testRecipient');
      if (!testRecipient) {
        this.logger.warn('POST_EMAIL_MODE=test but POST_EMAIL_TEST_RECIPIENT is empty');
        return;
      }
      // notified_at is left untouched so the post can still go out for real later.
      const added = await this.insertQueueRows(postId, [
        { email: normalizeEmail(testRecipient), name: null },
      ]);
      this.logger.log(`[test] Post ${postId}: queued ${added} email to ${testRecipient}`);
      return;
    }

    if (mode === 'dry_run') {
      const recipients = await this.eligibleRecipients();
      this.logger.log(
        `[dry_run] Post ${postId} would be emailed to ${recipients.length} recipients:\n` +
          recipients.map((r) => `  ${r.email}${r.name ? ` (${r.name})` : ''}`).join('\n'),
      );
      return;
    }

    // Claim the post atomically: whoever flips notified_at from NULL owns the
    // enqueue, so a double-click, re-approval or retry can't queue it twice.
    const claim = await this.posts.update(
      { id: postId, notifiedAt: IsNull(), status: PostStatus.APPROVED },
      { notifiedAt: new Date() },
    );
    if (!claim.affected) return;

    try {
      const recipients = await this.eligibleRecipients();
      const added = await this.insertQueueRows(postId, recipients);
      this.logger.log(`Post ${postId}: queued ${added} emails`);
    } catch (err) {
      // Nothing (or only part) was queued — release the claim so a re-approval
      // can retry. Rows already inserted are protected by the unique key.
      await this.posts.update({ id: postId }, { notifiedAt: null });
      throw err;
    }
  }

  eligibleRecipients(): Promise<Recipient[]> {
    return this.recipients.fetchRecipients();
  }

  private async insertQueueRows(postId: number, recipients: Recipient[]): Promise<number> {
    let added = 0;
    for (let i = 0; i < recipients.length; i += INSERT_CHUNK) {
      const result = await this.queue
        .createQueryBuilder()
        .insert()
        .into(PostEmailQueue)
        .values(
          recipients.slice(i, i + INSERT_CHUNK).map((r) => ({
            postId,
            email: r.email,
            recipientName: r.name,
            status: PostEmailStatus.QUEUED,
          })),
        )
        .orIgnore()
        .updateEntity(false)
        .execute();
      added += (result.raw as { affectedRows?: number }).affectedRows ?? 0;
    }
    return added;
  }

  // --- Worker (driven by the cron CLI, see src/cli/post-emails.ts) ---

  /** Sends one batch of queued emails. A MySQL advisory lock keeps two
   *  overlapping cron runs from sending the same rows. */
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

    const rows = await this.queue.find({
      where: { status: PostEmailStatus.QUEUED },
      order: { id: 'ASC' },
      take: batchSize,
    });
    if (rows.length === 0) return result;

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
        await this.sendForPost(post, row.email, row.recipientName);
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

  /** Renders and sends the "new post" email to a single address. Used by the
   *  worker, and directly by the CLI's `test` command. */
  async sendForPost(post: Post, email: string, recipientName: string | null): Promise<void> {
    const communityUrl = this.config.get<string>('communityUrl')!;
    const apiUrl = this.config.get<string>('apiPublicUrl')!;
    const absolute = (url: string | null | undefined) => toAbsoluteUrl(apiUrl, url);
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

  // --- Admin stats ---

  async stats(limit = 50): Promise<{ mode: PostEmailMode; posts: PostEmailStats[] }> {
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
      .getRawMany()) as {
      postId: string;
      content: string;
      notifiedAt: Date | null;
      queued: string;
      sent: string;
      failed: string;
      skipped: string;
    }[];

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
}
