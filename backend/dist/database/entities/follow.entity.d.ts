import { type Relation } from 'typeorm';
import { User } from './user.entity.js';
export declare class Follow {
    followerId: number;
    follower: Relation<User>;
    followingId: number;
    following: Relation<User>;
    createdAt: Date;
}
