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
import {
  errorMessage,
  hourlyAllowance,
  normalizeEmail,
  sleep,
  withAdvisoryLock,
} from './email-worker-utils.js';
import { postTitle } from './post-summary.js';
import {
  PostEmailsService,
  type PostEmailMode,
  type WorkerRunResult,
} from './post-emails.service.js';
import type { Recipient } from './taskdesk-recipients.service.js';

const BUILD_LOCK = 'dawoodtech_community_digest_build';
const WORKER_LOCK = 'dawoodtech_community_digest_worker';
const INSERT_CHUNK = 500;

export interface DigestStats {
  id: number;
  day: string;
  postCount: number;
  queued: number;
  sent: number;
  failed: number;
  skipped: number;
}

export interface DigestStatsResponse {
  mode: PostEmailMode;
  digestHour: number;
  timeZone: string;
  /** Approved posts waiting for the next digest. */
  pendingPosts: { postId: number; title: string }[];
  /** Emails still waiting in the older one-email-per-post queue. */
  legacyQueued: number;
  digests: DigestStats[];
}

/**
 * The daily "new posts" digest. Approving a post (with the email box ticked)
 * only marks it; once a day, after DIGEST_HOUR, the cron builds one digest of
 * every marked post and queues ONE email per recipient — however many posts
 * there were. The worker then sends those within EMAIL_HOURLY_LIMIT.
 */
@Injectable()
export class DigestEmailsService {
  private readonly logger = new Logger(DigestEmailsService.name);

  constructor(
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(EmailDigest) private readonly digests: Repository<EmailDigest>,
    @InjectRepository(DigestEmailQueue)
    private readonly queue: Repository<DigestEmailQueue>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly postEmails: PostEmailsService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  private get digestHour(): number {
    return this.config.get<number>('postEmails.digestHour') ?? 9;
  }

  private get timeZone(): string {
    return this.config.get<string>('postEmails.digestTimeZone') ?? 'Asia/Karachi';
  }

  /** Approved posts marked for email that no digest has carried yet, oldest first. */
  pendingPosts(): Promise<Post[]> {
    return this.posts.find({
      where: { status: PostStatus.APPROVED, notifyByEmail: true, notifiedAt: IsNull() },
      relations: { author: true, media: true },
      order: { reviewedAt: 'ASC', id: 'ASC' },
    });
  }

  // --- Building the day's digest ---

  /**
   * Builds today's digest if it's due: past DIGEST_HOUR (or `force`) and not
   * built yet today. A day with no new posts still gets an (empty) digest row,
   * so a post approved later that day waits for tomorrow rather than going out
   * on its own.
   */
  async buildDueDigest(force = false): Promise<void> {
    const { day, hour } = localDayAndHour(new Date(), this.timeZone);
    if (!force && hour < this.digestHour) return;
    if (await this.digests.findOneBy({ digestKey: day })) return;

    const built = await withAdvisoryLock(this.dataSource, BUILD_LOCK, () => this.build(day));
    if (built === null) this.logger.log('Another run is already building the digest — skipping.');
  }

  private async build(day: string): Promise<void> {
    // Re-check under the lock: an overlapping run may have just built it.
    if (await this.digests.findOneBy({ digestKey: day })) return;

    const posts = await this.pendingPosts();
    const postIds = posts.map((p) => Number(p.id));
    const mode = this.postEmails.mode;

    if (postIds.length === 0) {
      await this.digests.save(this.digests.create({ digestKey: day, postIds: [] }));
      this.logger.log(`Digest ${day}: no new posts today.`);
      return;
    }

    let recipients: Recipient[];
    if (mode === 'test') {
      const testRecipient = normalizeEmail(
        this.config.get<string>('postEmails.testRecipient') ?? '',
      );
      if (!testRecipient) {
        this.logger.warn('POST_EMAIL_MODE=test but POST_EMAIL_TEST_RECIPIENT is empty');
        return;
      }
      recipients = [{ email: testRecipient, name: null }];
    } else {
      recipients = await this.postEmails.eligibleRecipients();
    }

    if (mode === 'dry_run') {
      // Saved so the log appears once a day, but posts stay unsent for real later.
      await this.digests.save(this.digests.create({ digestKey: day, postIds }));
      this.logger.log(
        `[dry_run] Digest ${day} with ${postIds.length} post(s) would go to ${recipients.length} recipients:\n` +
          recipients.map((r) => `  ${r.email}${r.name ? ` (${r.name})` : ''}`).join('\n'),
      );
      return;
    }

    // One transaction: the digest row, marking its posts as sent (live only —
    // test mode leaves them for the real digest) and every queue row.
    await this.dataSource.transaction(async (manager) => {
      const digest = await manager.save(
        manager.create(EmailDigest, { digestKey: day, postIds }),
      );
      if (mode === 'live') {
        await manager.update(
          Post,
          { id: In(postIds), notifiedAt: IsNull() },
          { notifiedAt: new Date() },
        );
      }
      for (let i = 0; i < recipients.length; i += INSERT_CHUNK) {
        await manager
          .createQueryBuilder()
          .insert()
          .into(DigestEmailQueue)
          .values(
            recipients.slice(i, i + INSERT_CHUNK).map((r) => ({
              digestId: digest.id,
              email: r.email,
              recipientName: r.name,
              status: PostEmailStatus.QUEUED,
            })),
          )
          .orIgnore()
          .updateEntity(false)
          .execute();
      }
    });
    this.logger.log(
      `${mode === 'test' ? '[test] ' : ''}Digest ${day}: ${postIds.length} post(s), ` +
        `queued for ${recipients.length} recipient(s).`,
    );
  }

  // --- Sending (driven by the cron CLI) ---

  async processBatch(): Promise<WorkerRunResult | null> {
    if (!this.mail.isConfigured) return null;
    const result = await withAdvisoryLock(this.dataSource, WORKER_LOCK, () =>
      this.sendQueued(),
    );
    if (!result) this.logger.log('Another digest worker run is still in progress — skipping.');
    return result;
  }

  private async sendQueued(): Promise<WorkerRunResult> {
    const batchSize = this.config.get<number>('postEmails.batchSize') ?? 50;
    const delayMs = this.config.get<number>('postEmails.delayMs') ?? 1000;
    const maxAttempts = this.config.get<number>('postEmails.maxAttempts') ?? 3;
    const result: WorkerRunResult = { sent: 0, failed: 0, retrying: 0, skipped: 0 };

    if ((await this.queue.countBy({ status: PostEmailStatus.QUEUED })) === 0) return result;

    const allowance = await hourlyAllowance(
      this.dataSource,
      this.config.get<number>('postEmails.hourlyLimit') ?? 20,
    );
    if (allowance === 0) {
      this.logger.log('Hourly email limit reached — digest emails wait for a later run.');
      return result;
    }

    const rows = await this.queue.find({
      where: { status: PostEmailStatus.QUEUED },
      order: { id: 'ASC' },
      take: Math.min(batchSize, allowance),
    });

    // Per digest: its posts that are still published, in digest order.
    const digestPosts = new Map<number, { posts: Post[]; date: Date }>();

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
      const { posts, date } = digestPosts.get(digestId)!;

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
      } catch (err) {
        row.error = errorMessage(err).slice(0, 1000);
        if (row.attempts >= maxAttempts) {
          row.status = PostEmailStatus.FAILED;
          result.failed++;
          this.logger.error(
            `Giving up on digest ${digestId} to ${row.email} after ${row.attempts} attempts: ${row.error}`,
          );
        } else {
          result.retrying++;
          this.logger.warn(
            `Digest ${digestId} to ${row.email} failed (attempt ${row.attempts}): ${row.error}`,
          );
        }
      }
      await this.queue.save(row);

      if (delayMs > 0 && index < rows.length - 1) await sleep(delayMs);
    }

    return result;
  }

  // --- Admin stats ---

  async stats(limit = 14): Promise<DigestStatsResponse> {
    const [pending, legacyQueued, rows] = await Promise.all([
      this.pendingPosts(),
      this.postEmails.legacyQueuedCount(),
      this.dataSource.query(
        `SELECT d.id, d.digest_key AS day, d.post_ids AS postIds,
                COALESCE(SUM(q.status = 'queued'), 0) AS queued,
                COALESCE(SUM(q.status = 'sent'), 0) AS sent,
                COALESCE(SUM(q.status = 'failed'), 0) AS failed,
                COALESCE(SUM(q.status = 'skipped'), 0) AS skipped
         FROM email_digests d
         LEFT JOIN digest_email_queue q ON q.digest_id = d.id
         WHERE d.post_ids <> '[]'
         GROUP BY d.id, d.digest_key, d.post_ids
         ORDER BY d.id DESC
         LIMIT ?`,
        [limit],
      ) as Promise<
        {
          id: string;
          day: string;
          postIds: string;
          queued: string;
          sent: string;
          failed: string;
          skipped: string;
        }[]
      >,
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
        postCount: (JSON.parse(r.postIds) as number[]).length,
        queued: Number(r.queued),
        sent: Number(r.sent),
        failed: Number(r.failed),
        skipped: Number(r.skipped),
      })),
    };
  }
}
