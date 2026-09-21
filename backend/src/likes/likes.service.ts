import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Like } from '../database/entities/like.entity.js';
import { Post, PostStatus } from '../database/entities/post.entity.js';
import { User } from '../database/entities/user.entity.js';
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

  async like(postId: number, userId: number): Promise<void> {
    const post = await this.posts.findOneBy({ id: postId });
    if (!post || post.status !== PostStatus.APPROVED) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.likes.findOneBy({ postId, userId });
    if (existing) return;
    await this.likes.save(this.likes.create({ postId, userId }));

    this.events.emit(NotificationEvents.LikeCreated, {
      postId,
      postOwnerId: post.userId,
      actorId: userId,
    });
  }

  async unlike(postId: number, userId: number): Promise<void> {
    await this.likes.delete({ postId, userId });
  }

  async isLikedByUser(postId: number, userId?: number): Promise<boolean> {
    if (!userId) return false;
    const existing = await this.likes.findOneBy({ postId, userId });
    return !!existing;
  }

  async listLikers(postId: number): Promise<PublicUser[]> {
    const rows = await this.likes.find({ where: { postId } });
    if (rows.length === 0) return [];
    const users = await this.users.find({
      where: { id: In(rows.map((r) => r.userId)) },
    });
    return users.map(toPublicUser);
  }

  countsByPostIds(postIds: number[]): Promise<{ postId: string; count: string }[]> {
    if (postIds.length === 0) return Promise.resolve([]);
    return this.likes
      .createQueryBuilder('like')
      .select('like.postId', 'postId')
      .addSelect('COUNT(*)', 'count')
      .where('like.postId IN (:...postIds)', { postIds })
      .groupBy('like.postId')
      .getRawMany();
  }

  async likedPostIdsByUser(userId: number, postIds: number[]): Promise<Set<number>> {
    if (postIds.length === 0) return new Set();
    const rows = await this.likes.find({
      where: { userId, postId: In(postIds) },
    });
    return new Set(rows.map((r) => Number(r.postId)));
  }
}
