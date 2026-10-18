import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../database/entities/user.entity.js';
import {
  NotificationEvents,
  type PostSubmittedEvent,
} from '../notifications/notification.events.js';
import { PushService } from './push.service.js';

/** Pings admins' devices when a post lands in the review queue, so members
 *  aren't left waiting until someone happens to open the admin page. */
@Injectable()
export class ReviewAlertsListener {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly push: PushService,
  ) {}

  @OnEvent(NotificationEvents.PostSubmitted)
  async handlePostSubmitted({ authorId }: PostSubmittedEvent): Promise<void> {
    const [admins, author] = await Promise.all([
      this.users.find({
        select: { id: true },
        where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE },
      }),
      this.users.findOne({
        select: { id: true, fullName: true },
        where: { id: authorId },
      }),
    ]);
    await Promise.all(
      admins.map((admin) =>
        this.push.sendToUser(admin.id, {
          title: 'Post waiting for review',
          body: `${author?.fullName ?? 'A member'} shared a new post`,
          url: '/admin/review',
          // One alert that updates, not a stack of them.
          tag: 'review-queue',
        }),
      ),
    );
  }
}
