import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { PostsService } from './posts.service.js';
import { PinPostDto } from './dto/pin-post.dto.js';
export declare class AdminPostsController {
    private readonly posts;
    constructor(posts: PostsService);
    stats(): Promise<{
        pending: number;
        avgWaitMinutes: number | null;
        reviewed30d: number;
    }>;
    pending(): Promise<import("./post.mapper.js").PostResponse[]>;
    approve(id: number, admin: AuthenticatedUser): Promise<import("./post.mapper.js").PostResponse>;
    pin(id: number, admin: AuthenticatedUser, dto: PinPostDto): Promise<import("./post.mapper.js").PostResponse>;
    reject(id: number, admin: AuthenticatedUser): Promise<import("./post.mapper.js").PostResponse>;
}
