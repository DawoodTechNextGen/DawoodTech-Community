import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { FollowsService } from './follows.service.js';
export declare class FollowsController {
    private readonly follows;
    constructor(follows: FollowsService);
    follow(id: number, user: AuthenticatedUser): Promise<{
        success: boolean;
    }>;
    unfollow(id: number, user: AuthenticatedUser): Promise<void>;
    followers(id: number): Promise<import("../users/user.mapper.js").PublicUser[]>;
    following(id: number): Promise<import("../users/user.mapper.js").PublicUser[]>;
    followStatus(id: number, user: AuthenticatedUser): Promise<{
        isFollowing: boolean;
    }>;
}
