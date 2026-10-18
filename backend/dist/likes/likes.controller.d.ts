import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { LikesService } from './likes.service.js';
import { ReactDto } from './dto/react.dto.js';
export declare class LikesController {
    private readonly likes;
    constructor(likes: LikesService);
    like(id: number, user: AuthenticatedUser, dto: ReactDto): Promise<{
        success: boolean;
    }>;
    unlike(id: number, user: AuthenticatedUser): Promise<void>;
    likers(id: number): Promise<import("../users/user.mapper.js").PublicUser[]>;
}
