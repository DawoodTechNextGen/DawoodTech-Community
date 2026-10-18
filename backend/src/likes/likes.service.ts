import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Like, Reaction } from '../database/entities/like.entity.js';
import { Post, PostStatus } from '../database/entities/post.entity.js';
import { User, UserStatus } from '../database/entities/user.entity.js';
import { NotificationEvents } from '../notifications/notification.events.js';
import { toPublicUser, type PublicUser } from '../users/user.mapper.js';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like) private readonly likes: Repository<Like>,
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly events: EventEmitter2,
  ) {}

  /** Adds the member's reaction, or switches it to another emoji. Only the
   *  first reaction notifies the post's author. */
  async like(postId: number, userId: number, reaction = Reaction.LIKE): Promise<void> {
    const post = await this.posts.findOneBy({ id: postId });
    if (!post || post.status !== PostStatus.APPROVED) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.likes.findOneBy({ postId, userId });
    if (existing) {
      if (existing.reaction !== reaction) await this.likes.update({ postId, userId }, { reaction });
      return;
    }
    await this.likes.save(this.likes.create({ postId, userId, reaction }));

    this.events.emit(NotificationEvents.LikeCreated, {
      postId,
      postOwnerId: post.userId,
      actorId: userId,
    });
  }

  async unlike(postId: number, userId: number): Promise<void> {
    await this.likes.delete({ postId, userId });
  }

  async listLikers(postId: number): Promise<PublicUser[]> {
    const rows = await this.likes.find({ where: { postId } });
    if (rows.length === 0) return [];
    const users = await this.users.find({
      where: { id: In(rows.map((r) => r.userId)), status: UserStatus.ACTIVE },
    });
    return users.map(toPublicUser);
  }

  /** Reaction counts per post, broken down by emoji. */
  countsByPostIds(
    postIds: number[],
  ): Promise<{ postId: string; reaction: Reaction; count: string }[]> {
    if (postIds.length === 0) return Promise.resolve([]);
    return this.likes
      .createQueryBuilder('like')
      .select('like.postId', 'postId')
      .addSelect('like.reaction', 'reaction')
      .addSelect('COUNT(*)', 'count')
      .where('like.postId IN (:...postIds)', { postIds })
      .groupBy('like.postId')
      .addGroupBy('like.reaction')
      .getRawMany();
  }

  /** The viewer's own reaction on each of these posts. */
  async reactionsByUser(userId: number, postIds: number[]): Promise<Map<number, Reaction>> {
    if (postIds.length === 0) return new Map();
    const rows = await this.likes.find({ where: { userId, postId: In(postIds) } });
    return new Map(rows.map((r) => [Number(r.postId), r.reaction]));
  }
}
