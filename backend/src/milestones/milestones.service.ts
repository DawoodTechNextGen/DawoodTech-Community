import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Milestone, MilestoneKind } from '../database/entities/milestone.entity.js';
import { Post, PostStatus } from '../database/entities/post.entity.js';
import { User } from '../database/entities/user.entity.js';
import {
  NotificationEvents,
  type UserVerifiedEvent,
} from '../notifications/notification.events.js';

/**
 * Celebration posts written by the app: a welcome when someone joins. It goes
 * out under the member's own name (so replies reach them as notifications),
 * straight to the feed, and only once per member.
 */
@Injectable()
export class MilestonesService {
  constructor(
    @InjectRepository(Milestone) private readonly milestones: Repository<Milestone>,
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  @OnEvent(NotificationEvents.UserVerified)
  async handleUserVerified({ userId }: UserVerifiedEvent): Promise<void> {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) return;
    await this.celebrate(
      `welcome:${user.id}`,
      MilestoneKind.JOINED,
      user,
      `👋 ${user.fullName} just joined DawoodTech Community! Say hi and help them feel at home.`,
    );
  }

  /** Writes the celebration post once per `sourceKey`. Returns whether it did. */
  private async celebrate(
    sourceKey: string,
    kind: MilestoneKind,
    member: User,
    content: string,
  ): Promise<boolean> {
    // Claiming the unique key first makes this safe against double runs.
    const claimed = await this.milestones
      .createQueryBuilder()
      .insert()
      .into(Milestone)
      .values({ sourceKey, kind, userId: member.id })
      .orIgnore()
      .execute();
    if (!claimed.raw?.affectedRows) return false;

    const post = await this.posts.save(
      this.posts.create({
        userId: member.id,
        content,
        milestone: kind,
        status: PostStatus.APPROVED,
        reviewedAt: new Date(),
      }),
    );
    await this.milestones.update({ sourceKey }, { postId: post.id });
    return true;
  }
}
