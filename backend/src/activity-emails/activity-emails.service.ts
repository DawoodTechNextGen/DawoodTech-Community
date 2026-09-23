import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import {
  ActivityEmailQueue,
  ActivityEmailType,
} from '../database/entities/activity-email-queue.entity.js';
import { Comment } from '../database/entities/comment.entity.js';
import { Follow } from '../database/entities/follow.entity.js';
import { Like } from '../database/entities/like.entity.js';
import { Post, PostStatus } from '../database/entities/post.entity.js';
import { PostEmailStatus } from '../database/entities/post-email-queue.entity.js';
import { User, UserStatus } from '../database/entities/user.entity.js';
import { activityTemplate, type ActivityPostPreview } from '../mail/community-templates.js';
import { MailService } from '../mail/mail.service.js';
import {
  NotificationEvents,
  type CommentPostedEvent,
  type FollowCreatedEvent,
  type LikeCreatedEvent,
} from '../notifications/notification.events.js';
import {
  errorMessage,
  normalizeEmail,
  sleep,
  toAbsoluteUrl,
  withAdvisoryLock,
} from '../post-emails/email-worker-utils.js';
import type { PostEmailMode, WorkerRunResult } from '../post-emails/post-emails.service.js';
import { postTitle } from '../post-emails/post-summary.js';
import { commentTargets, type ActivityTarget } from './activity-recipients.js';

const WORKER_LOCK = 'dawoodtech_community_activity_email_worker';
const COMMENT_EXCERPT_MAX = 300;

interface EnqueueContext {
  postId: number | null;
  actorId: number;
  commentId: number | null;
  dedupeKey: (recipientId: number) => string;
}

/** Emails community members when someone likes their post, comments on it,
 *  replies to their comment, joins a thread they commented in, or follows them. */
@Injectable()
export class ActivityEmailsService {
  private readonly logger = new Logger(ActivityEmailsService.name);

  constructor(
    @InjectRepository(ActivityEmailQueue)
    private readonly queue: Repository<ActivityEmailQueue>,
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
    @InjectRepository(Like) private readonly likes: Repository<Like>,
    @InjectRepository(Follow) private readonly follows: Repository<Follow>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  private get mode(): PostEmailMode {
    return this.config.get<PostEmailMode>('postEmails.activityMode') ?? 'dry_run';
  }

  // --- Enqueue (event listeners — never block the like/comment request) ---

  @OnEvent(NotificationEvents.LikeCreated)
  async handleLikeCreated({ postId, postOwnerId, actorId }: LikeCreatedEvent): Promise<void> {
    if (Number(postOwnerId) === Number(actorId)) return;
    await this.safely(`like on post ${postId}`, () =>
      this.enqueue([{ userId: postOwnerId, type: ActivityEmailType.LIKE }], {
        postId,
        actorId,
        commentId: null,
        dedupeKey: (recipientId) => `like:${postId}:${actorId}:${recipientId}`,
      }),
    );
  }

  @OnEvent(NotificationEvents.CommentPosted)
  async handleCommentPosted(event: CommentPostedEvent): Promise<void> {
    await this.safely(`comment ${event.commentId}`, async () => {
      const earlier = await this.comments
        .createQueryBuilder('c')
        .select('DISTINCT c.userId', 'userId')
        .where('c.postId = :postId', { postId: event.postId })
        .andWhere('c.id < :commentId', { commentId: event.commentId })
        .getRawMany<{ userId: string }>();

      await this.enqueue(
        commentTargets(
          event,
          earlier.map((r) => Number(r.userId)),
        ),
        {
          postId: event.postId,
          actorId: event.actorId,
          commentId: event.commentId,
          dedupeKey: (recipientId) => `comment:${event.commentId}:${recipientId}`,
        },
      );
    });
  }

  @OnEvent(NotificationEvents.FollowCreated)
  async handleFollowCreated({ followingId, followerId }: FollowCreatedEvent): Promise<void> {
    if (Number(followingId) === Number(followerId)) return;
    await this.safely(`follow of user ${followingId}`, () =>
      this.enqueue([{ userId: followingId, type: ActivityEmailType.FOLLOW }], {
        postId: null,
        actorId: followerId,
        commentId: null,
        dedupeKey: (recipientId) => `follow:${followerId}:${recipientId}`,
      }),
    );
  }

  private async safely(what: string, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (err) {
      this.logger.error(`Couldn't queue activity emails for ${what}: ${errorMessage(err)}`);
    }
  }

  private async enqueue(targets: ActivityTarget[], ctx: EnqueueContext): Promise<void> {
    if (targets.length === 0) return;

    // Only active members with a verified address.
    const users = await this.users.find({
      where: {
        id: In(targets.map((t) => t.userId)),
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
      },
    });
    const byId = new Map(users.map((u) => [Number(u.id), u]));

    const rows = targets.flatMap((t) => {
      const user = byId.get(Number(t.userId));
      if (!user) return [];
      return [{ ...t, email: normalizeEmail(user.email) }];
    });
    if (rows.length === 0) return;

    const mode = this.mode;
    if (mode === 'dry_run') {
      this.logger.log(
        `[dry_run] Activity emails${ctx.postId ? ` for post ${ctx.postId}` : ''}:\n` +
          rows.map((r) => `  ${r.type} → ${r.email}`).join('\n'),
      );
      return;
    }

    let testRecipient = '';
    if (mode === 'test') {
      testRecipient = normalizeEmail(this.config.get<string>('postEmails.testRecipient') ?? '');
      if (!testRecipient) {
        this.logger.warn('Activity email mode is test but POST_EMAIL_TEST_RECIPIENT is empty');
        return;
      }
    }

    await this.queue
      .createQueryBuilder()
      .insert()
      .into(ActivityEmailQueue)
      .values(
        rows.map((r) => ({
          dedupeKey: ctx.dedupeKey(r.userId),
          recipientUserId: r.userId,
          email: testRecipient || r.email,
          type: r.type,
          postId: ctx.postId,
          actorId: ctx.actorId,
          commentId: ctx.commentId,
          status: PostEmailStatus.QUEUED,
        })),
      )
      .orIgnore()
      .updateEntity(false)
      .execute();
  }

  // --- Worker (driven by the cron CLI, see src/cli/post-emails.ts) ---

  async processBatch(): Promise<WorkerRunResult | null> {
    if (!this.mail.isConfigured) {
      this.logger.warn('SMTP is not configured (MAIL_HOST) — not sending anything.');
      return null;
    }
    const result = await withAdvisoryLock(this.dataSource, WORKER_LOCK, () =>
      this.sendQueued(),
    );
    if (!result) this.logger.log('Another activity-email worker run is still in progress — skipping.');
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

    const handled = new Set<number>();
    let sentAny = false;

    for (const row of rows) {
      if (handled.has(Number(row.id))) continue;

      // Likes for the same post+recipient (and follows of the same recipient)
      // that are still waiting go out as one email — "Ali and 3 others liked
      // your post" — instead of one per like/follow.
      const group =
        row.type === ActivityEmailType.LIKE || row.type === ActivityEmailType.FOLLOW
          ? await this.queue.find({
              where: {
                status: PostEmailStatus.QUEUED,
                type: row.type,
                postId: row.postId ?? IsNull(),
                recipientUserId: row.recipientUserId,
              },
              order: { id: 'ASC' },
            })
          : [row];
      group.forEach((r) => handled.add(Number(r.id)));

      const skip = async (items: ActivityEmailQueue[], reason: string) => {
        for (const item of items) {
          item.status = PostEmailStatus.SKIPPED;
          item.error = reason;
        }
        await this.queue.save(items);
        result.skipped += items.length;
      };

      let post: Post | null = null;
      if (row.postId) {
        post = await this.posts.findOne({
          where: { id: row.postId },
          relations: { author: true, media: true },
        });
        if (!post || post.status !== PostStatus.APPROVED) {
          await skip(group, 'Post no longer published');
          continue;
        }
      }

      let active = group;
      let comment: Comment | null = null;
      if (row.type === ActivityEmailType.FOLLOW) {
        // Drop follows that were undone before we got to them.
        const stillFollowing = await this.follows.find({
          where: {
            followingId: row.recipientUserId,
            followerId: In(group.map((r) => r.actorId)),
          },
        });
        const followerIds = new Set(stillFollowing.map((f) => Number(f.followerId)));
        const withdrawn = group.filter((r) => !followerIds.has(Number(r.actorId)));
        if (withdrawn.length) await skip(withdrawn, 'Unfollowed');
        active = group.filter((r) => followerIds.has(Number(r.actorId)));
        if (active.length === 0) continue;
      } else if (!post) {
        await skip(group, 'Post no longer published');
        continue;
      } else if (row.type === ActivityEmailType.LIKE) {
        // Drop likes that were taken back before we got to them.
        const stillLiked = await this.likes.find({
          where: { postId: post.id, userId: In(group.map((r) => r.actorId)) },
        });
        const likerIds = new Set(stillLiked.map((l) => Number(l.userId)));
        const withdrawn = group.filter((r) => !likerIds.has(Number(r.actorId)));
        if (withdrawn.length) await skip(withdrawn, 'Like was removed');
        active = group.filter((r) => likerIds.has(Number(r.actorId)));
        if (active.length === 0) continue;
      } else {
        comment = row.commentId ? await this.comments.findOneBy({ id: row.commentId }) : null;
        if (!comment) {
          await skip(group, 'Comment was deleted');
          continue;
        }
      }

      if (sentAny && delayMs > 0) await sleep(delayMs);
      sentAny = true;

      for (const item of active) {
        item.attempts += 1;
        item.lastAttemptAt = new Date();
      }
      try {
        await this.send(active, post, comment);
        for (const item of active) {
          item.status = PostEmailStatus.SENT;
          item.sentAt = new Date();
          item.error = null;
        }
        result.sent++;
      } catch (err) {
        const message = errorMessage(err).slice(0, 1000);
        const giveUp = active[0]!.attempts >= maxAttempts;
        for (const item of active) {
          item.error = message;
          if (giveUp) item.status = PostEmailStatus.FAILED;
        }
        if (giveUp) {
          result.failed++;
          this.logger.error(`Giving up on ${row.type} email to ${row.email} after ${maxAttempts} attempts: ${message}`);
        } else {
          result.retrying++;
          this.logger.warn(
            `${row.type} email to ${row.email} failed (attempt ${active[0]!.attempts}): ${message}`,
          );
        }
      }
      await this.queue.save(active);
    }

    return result;
  }

  private async send(
    group: ActivityEmailQueue[],
    post: Post | null,
    comment: Comment | null,
  ): Promise<void> {
    const communityUrl = this.config.get<string>('communityUrl')!;
    const apiUrl = this.config.get<string>('apiPublicUrl')!;

    const row = group[0]!;
    // Lead with the most recent actor, e.g. "Sara and 2 others liked your post".
    const leadActorId = group[group.length - 1]!.actorId;
    const [recipient, actor] = await Promise.all([
      this.users.findOneBy({ id: row.recipientUserId }),
      this.users.findOneBy({ id: leadActorId }),
    ]);
    const actorName = actor?.fullName ?? 'Someone';
    const ownerName = post?.author?.fullName ?? 'a community member';
    const others = group.length - 1;

    const copy: Record<
      ActivityEmailType,
      { heading: string; action: string; postLabel: string; button: string }
    > = {
      [ActivityEmailType.LIKE]: {
        heading: 'New like',
        action:
          others > 0
            ? `and ${others} other${others > 1 ? 's' : ''} liked your post`
            : 'liked your post',
        postLabel: 'Your post',
        button: 'View post',
      },
      [ActivityEmailType.COMMENT]: {
        heading: 'New comment',
        action: 'commented on your post',
        postLabel: 'Your post',
        button: 'View comment',
      },
      [ActivityEmailType.REPLY]: {
        heading: 'New reply',
        action: 'replied to your comment',
        postLabel: `${ownerName}'s post`,
        button: 'View reply',
      },
      [ActivityEmailType.THREAD_COMMENT]: {
        heading: 'New comment',
        action: 'also commented on a post you commented on',
        postLabel: `${ownerName}'s post`,
        button: 'View comment',
      },
      [ActivityEmailType.FOLLOW]: {
        heading: 'New follower',
        action:
          others > 0
            ? `and ${others} other${others > 1 ? 's' : ''} started following you`
            : 'started following you',
        postLabel: '',
        button: others > 0 ? 'See your followers' : 'View profile',
      },
    };
    const { heading, action, postLabel, button } = copy[row.type];

    const commentText = comment
      ? comment.content.length > COMMENT_EXCERPT_MAX
        ? `${comment.content.slice(0, COMMENT_EXCERPT_MAX - 1).trimEnd()}…`
        : comment.content
      : null;
    let preview: ActivityPostPreview | null = null;
    if (post) {
      const firstImage = [...(post.media ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)[0];
      preview = {
        title: postTitle(post.content),
        label: postLabel,
        imageUrl: toAbsoluteUrl(apiUrl, firstImage?.url),
        url: `${communityUrl}/post/${post.id}`,
      };
    }
    // Follow emails link to the follower's profile, or to the recipient's own
    // profile (where the followers list lives) when several are merged.
    const buttonUrl =
      preview?.url ??
      `${communityUrl}/profile/${others > 0 ? row.recipientUserId : leadActorId}`;

    const { subject, html, text } = activityTemplate({
      heading,
      recipientName: recipient?.fullName ?? null,
      recipientEmail: row.email,
      actorName,
      actorAvatarUrl: toAbsoluteUrl(apiUrl, actor?.avatarUrl),
      action,
      commentText,
      post: preview,
      buttonLabel: button,
      buttonUrl,
      communityUrl,
      logoUrl: `${communityUrl}/logo-full.png`,
      date: new Date(),
    });

    await this.mail.send({ to: row.email, subject, html, text });
  }
}
