import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
} from '../database/entities/notification.entity.js';
import {
  NotificationEvents,
  type CommentCreatedEvent,
  type FollowCreatedEvent,
  type LikeCreatedEvent,
  type PostReviewedEvent,
} from './notification.events.js';
import { toNotificationResponse, type NotificationResponse } from './notification.mapper.js';

const PAGE_SIZE = 20;

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
  ) {}

  @OnEvent(NotificationEvents.CommentCreated)
  async handleCommentCreated({ postId, postOwnerId, actorId }: CommentCreatedEvent) {
    if (postOwnerId === actorId) return;
    await this.record(postOwnerId, actorId, NotificationType.COMMENT, postId);
  }

  @OnEvent(NotificationEvents.LikeCreated)
  async handleLikeCreated({ postId, postOwnerId, actorId }: LikeCreatedEvent) {
    if (postOwnerId === actorId) return;
    await this.record(postOwnerId, actorId, NotificationType.LIKE, postId);
  }

  @OnEvent(NotificationEvents.FollowCreated)
  async handleFollowCreated({ followingId, followerId }: FollowCreatedEvent) {
    await this.record(followingId, followerId, NotificationType.FOLLOW, null);
  }

  @OnEvent(NotificationEvents.PostApproved)
  async handlePostApproved({ postId, authorId, adminId }: PostReviewedEvent) {
    if (authorId === adminId) return;
    await this.record(authorId, adminId, NotificationType.POST_APPROVED, postId);
  }

  @OnEvent(NotificationEvents.PostRejected)
  async handlePostRejected({ postId, authorId, adminId }: PostReviewedEvent) {
    if (authorId === adminId) return;
    await this.record(authorId, adminId, NotificationType.POST_REJECTED, postId);
  }

  private async record(
    recipientId: number,
    actorId: number,
    type: NotificationType,
    postId: number | null,
  ): Promise<void> {
    await this.notifications.save(
      this.notifications.create({ recipientId, actorId, type, postId }),
    );
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
      qb.andWhere('notification.createdAt < :cursor', { cursor: new Date(cursor) });
    }

    const rows = await qb.getMany();
    return {
      items: rows.map(toNotificationResponse),
      nextCursor:
        rows.length === PAGE_SIZE
          ? rows[rows.length - 1]!.createdAt.toISOString()
          : null,
    };
  }

  async unreadCount(userId: number): Promise<number> {
    return this.notifications.count({ where: { recipientId: userId, isRead: false } });
  }

  async markRead(id: number, userId: number): Promise<void> {
    const notification = await this.notifications.findOneBy({ id });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.recipientId !== userId) {
      throw new ForbiddenException('Not your notification');
    }
    if (!notification.isRead) {
      notification.isRead = true;
      await this.notifications.save(notification);
    }
  }

  async markAllRead(userId: number): Promise<void> {
    await this.notifications.update(
      { recipientId: userId, isRead: false },
      { isRead: true },
    );
  }
}
