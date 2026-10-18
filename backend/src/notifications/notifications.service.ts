import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Notification, NotificationType } from '../database/entities/notification.entity.js';
import {
  NotificationEvents,
  type CommentCreatedEvent,
  type ReplyCreatedEvent,
  type FollowCreatedEvent,
  type LikeCreatedEvent,
  type PostReviewedEvent,
  type MentionsPublishedEvent,
  type AnnouncementPinnedEvent,
  type AnswerAcceptedEvent,
} from './notification.events.js';
import { User, UserStatus } from '../database/entities/user.entity.js';
import { extractMentions } from '../common/mentions.js';
import { toNotificationResponse, type NotificationResponse } from './notification.mapper.js';
import { NotificationsGateway } from './notifications.gateway.js';
import { PushService, type PushMessage } from '../push/push.service.js';
import { sameId } from '../common/same-id.js';

const PAGE_SIZE = 20;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    private readonly gateway: NotificationsGateway,
    private readonly push: PushService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  @OnEvent(NotificationEvents.AnswerAccepted)
  async handleAnswerAccepted({ postId, answerAuthorId, actorId }: AnswerAcceptedEvent) {
    if (sameId(answerAuthorId, actorId)) return;
    await this.record(answerAuthorId, actorId, NotificationType.ANSWER_ACCEPTED, postId);
  }

  /** An admin pinned an announcement and chose to tell everyone. */
  @OnEvent(NotificationEvents.AnnouncementPinned)
  async handleAnnouncement({ postId, adminId }: AnnouncementPinnedEvent) {
    const members = await this.users.find({
      select: { id: true },
      where: { status: UserStatus.ACTIVE, isEmailVerified: true },
    });
    for (const { id } of members) {
      if (sameId(id, adminId)) continue;
      const already = await this.notifications.existsBy({
        recipientId: id,
        postId,
        type: NotificationType.ANNOUNCEMENT,
      });
      if (!already) await this.record(id, adminId, NotificationType.ANNOUNCEMENT, postId);
    }
  }

  /** "@username" in an approved post or a comment notifies that member —
   *  once per post per person who mentioned them, never yourself. */
  @OnEvent(NotificationEvents.MentionsPublished)
  async handleMentions({ postId, actorId, text, skipUserIds }: MentionsPublishedEvent) {
    const usernames = extractMentions(text);
    if (usernames.length === 0) return;
    const mentioned = await this.users.find({
      select: { id: true },
      where: { username: In(usernames), status: UserStatus.ACTIVE },
    });
    for (const { id } of mentioned) {
      if (sameId(id, actorId) || skipUserIds.some((skip) => sameId(skip, id))) continue;
      const already = await this.notifications.existsBy({
        recipientId: id,
        actorId,
        postId,
        type: NotificationType.MENTION,
      });
      if (!already) await this.record(id, actorId, NotificationType.MENTION, postId);
    }
  }

  @OnEvent(NotificationEvents.CommentCreated)
  async handleCommentCreated({ postId, postOwnerId, actorId }: CommentCreatedEvent) {
    if (sameId(postOwnerId, actorId)) return;
    await this.record(postOwnerId, actorId, NotificationType.COMMENT, postId);
  }

  @OnEvent(NotificationEvents.ReplyCreated)
  async handleReplyCreated({ postId, parentCommentAuthorId, actorId }: ReplyCreatedEvent) {
    if (sameId(parentCommentAuthorId, actorId)) return;
    await this.record(parentCommentAuthorId, actorId, NotificationType.REPLY, postId);
  }

  @OnEvent(NotificationEvents.LikeCreated)
  async handleLikeCreated({ postId, postOwnerId, actorId }: LikeCreatedEvent) {
    if (sameId(postOwnerId, actorId)) return;
    // Unlike + like again (or trying every reaction) mustn't spam the author.
    const already = await this.notifications.existsBy({
      recipientId: postOwnerId,
      actorId,
      postId,
      type: NotificationType.LIKE,
    });
    if (!already) await this.record(postOwnerId, actorId, NotificationType.LIKE, postId);
  }

  @OnEvent(NotificationEvents.FollowCreated)
  async handleFollowCreated({ followingId, followerId }: FollowCreatedEvent) {
    await this.record(followingId, followerId, NotificationType.FOLLOW, null);
  }

  @OnEvent(NotificationEvents.PostApproved)
  async handlePostApproved({ postId, authorId, adminId }: PostReviewedEvent) {
    if (sameId(authorId, adminId)) return;
    await this.record(authorId, adminId, NotificationType.POST_APPROVED, postId);
  }

  @OnEvent(NotificationEvents.PostRejected)
  async handlePostRejected({ postId, authorId, adminId }: PostReviewedEvent) {
    if (sameId(authorId, adminId)) return;
    await this.record(authorId, adminId, NotificationType.POST_REJECTED, postId);
  }

  private async record(
    recipientId: number,
    actorId: number,
    type: NotificationType,
    postId: number | null,
  ): Promise<void> {
    const saved = await this.notifications.save(
      this.notifications.create({ recipientId, actorId, type, postId }),
    );
    // Push it to the recipient's open tabs; a failure here must not lose the
    // notification, which is already stored and shows on the next load.
    try {
      const [withActor, unread] = await Promise.all([
        this.notifications.findOneOrFail({
          where: { id: saved.id },
          relations: { actor: true },
        }),
        this.unreadCount(recipientId),
      ]);
      const response = toNotificationResponse(withActor);
      this.gateway.sendNotification(recipientId, response, unread);
      // Reaches devices where the app is closed; the service worker skips it
      // when an app window is already in focus (the toast covers that).
      void this.push.sendToUser(recipientId, { ...pushMessageFor(response), badge: unread });
    } catch (err) {
      this.logger.warn(
        `Couldn't push notification ${saved.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async findForUser(
    userId: number,
    cursor?: string,
  ): Promise<{ items: NotificationResponse[]; nextCursor: string | null }> {
    const qb = this.notifications
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.actor', 'actor')
      .where('notification.recipientId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .take(PAGE_SIZE);

    if (cursor) {
      qb.andWhere('notification.createdAt < :cursor', {
        cursor: new Date(cursor),
      });
    }

    const rows = await qb.getMany();
    return {
      items: rows.map(toNotificationResponse),
      nextCursor: rows.length === PAGE_SIZE ? rows[rows.length - 1]!.createdAt.toISOString() : null,
    };
  }

  async unreadCount(userId: number): Promise<number> {
    return this.notifications.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  async markRead(id: number, userId: number): Promise<void> {
    const notification = await this.notifications.findOneBy({ id });
    if (!notification) throw new NotFoundException('Notification not found');
    if (!sameId(notification.recipientId, userId)) {
      throw new ForbiddenException('Not your notification');
    }
    if (!notification.isRead) {
      notification.isRead = true;
      await this.notifications.save(notification);
      await this.syncUnreadCount(userId);
    }
  }

  async markAllRead(userId: number): Promise<void> {
    await this.notifications.update({ recipientId: userId, isRead: false }, { isRead: true });
    await this.syncUnreadCount(userId);
  }

  /** Keeps the badge right in the member's other open tabs. */
  private async syncUnreadCount(userId: number): Promise<void> {
    this.gateway.sendUnreadCount(userId, await this.unreadCount(userId));
  }
}

/** Lock-screen text for a notification; mirrors the web app's wording. */
function pushMessageFor(n: NotificationResponse): PushMessage {
  const who = n.actorName || 'Someone';
  const post = n.postId ? `/post/${n.postId}` : '/notifications';
  switch (n.type as NotificationType) {
    case NotificationType.COMMENT:
      return {
        title: 'New comment',
        body: `${who} commented on your post`,
        url: post,
        tag: `post-${n.postId}`,
      };
    case NotificationType.REPLY:
      return {
        title: 'New reply',
        body: `${who} replied to your comment`,
        url: post,
        tag: `post-${n.postId}`,
      };
    case NotificationType.LIKE:
      return {
        title: 'New reaction',
        body: `${who} reacted to your post`,
        url: post,
        tag: `like-${n.postId}`,
      };
    case NotificationType.FOLLOW:
      return {
        title: 'New follower',
        body: `${who} started following you`,
        url: `/profile/${n.actorId}`,
      };
    case NotificationType.POST_APPROVED:
      return {
        title: 'Post approved',
        body: 'Your post was approved and is now live',
        url: post,
      };
    case NotificationType.MENTION:
      return {
        title: 'You were mentioned',
        body: `${who} mentioned you`,
        url: post,
        tag: `post-${n.postId}`,
      };
    case NotificationType.ANNOUNCEMENT:
      return { title: '📢 Announcement', body: `${who} posted an announcement`, url: post };
    case NotificationType.ANSWER_ACCEPTED:
      return { title: '✅ Answer accepted', body: `${who} accepted your answer`, url: post };
    case NotificationType.POST_REJECTED:
      return {
        title: 'Post not approved',
        body: "Your post wasn't approved",
        url: post,
      };
  }
}
