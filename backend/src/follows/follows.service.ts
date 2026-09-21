import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Follow } from '../database/entities/follow.entity.js';
import { User } from '../database/entities/user.entity.js';
import { NotificationEvents } from '../notifications/notification.events.js';
import { toPublicUser, type PublicUser } from '../users/user.mapper.js';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow) private readonly follows: Repository<Follow>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly events: EventEmitter2,
  ) {}

  async follow(followerId: number, followingId: number): Promise<void> {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }
    const target = await this.users.findOneBy({ id: followingId });
    if (!target) throw new NotFoundException('User not found');

    const existing = await this.follows.findOneBy({ followerId, followingId });
    if (existing) return;

    await this.follows.save(this.follows.create({ followerId, followingId }));
    this.events.emit(NotificationEvents.FollowCreated, { followingId, followerId });
  }

  async unfollow(followerId: number, followingId: number): Promise<void> {
    await this.follows.delete({ followerId, followingId });
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const existing = await this.follows.findOneBy({ followerId, followingId });
    return !!existing;
  }

  async getFollowedIds(followerId: number): Promise<number[]> {
    const rows = await this.follows.find({ where: { followerId } });
    return rows.map((r) => r.followingId);
  }

  async listFollowers(userId: number): Promise<PublicUser[]> {
    const rows = await this.follows.find({ where: { followingId: userId } });
    if (rows.length === 0) return [];
    const users = await this.users.find({
      where: { id: In(rows.map((r) => r.followerId)) },
    });
    return users.map(toPublicUser);
  }

  async listFollowing(userId: number): Promise<PublicUser[]> {
    const rows = await this.follows.find({ where: { followerId: userId } });
    if (rows.length === 0) return [];
    const users = await this.users.find({
      where: { id: In(rows.map((r) => r.followingId)) },
    });
    return users.map(toPublicUser);
  }
}
