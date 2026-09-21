import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { LikesService } from './likes.service.js';
export declare class LikesController {
    private readonly likes;
    constructor(likes: LikesService);
    like(id: string, user: AuthenticatedUser): Promise<{
        success: boolean;
    }>;
    unlike(id: string, user: AuthenticatedUser): Promise<void>;
    likers(id: string): Promise<import("../users/user.mapper.js").PublicUser[]>;
}
