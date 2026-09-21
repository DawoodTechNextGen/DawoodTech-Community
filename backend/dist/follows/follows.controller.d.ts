import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { FollowsService } from './follows.service.js';
export declare class FollowsController {
    private readonly follows;
    constructor(follows: FollowsService);
    follow(id: string, user: AuthenticatedUser): Promise<{
        success: boolean;
    }>;
    unfollow(id: string, user: AuthenticatedUser): Promise<void>;
    followers(id: string): Promise<import("../users/user.mapper.js").PublicUser[]>;
    following(id: string): Promise<import("../users/user.mapper.js").PublicUser[]>;
    followStatus(id: string, user: AuthenticatedUser): Promise<{
        isFollowing: boolean;
    }>;
}
