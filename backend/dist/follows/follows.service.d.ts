import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { Follow } from '../database/entities/follow.entity.js';
import { User } from '../database/entities/user.entity.js';
import { type PublicUser } from '../users/user.mapper.js';
export declare class FollowsService {
    private readonly follows;
    private readonly users;
    private readonly events;
    constructor(follows: Repository<Follow>, users: Repository<User>, events: EventEmitter2);
    follow(followerId: number, followingId: number): Promise<void>;
    unfollow(followerId: number, followingId: number): Promise<void>;
    isFollowing(followerId: number, followingId: number): Promise<boolean>;
    getFollowedIds(followerId: number): Promise<number[]>;
    listFollowers(userId: number): Promise<PublicUser[]>;
    listFollowing(userId: number): Promise<PublicUser[]>;
}
