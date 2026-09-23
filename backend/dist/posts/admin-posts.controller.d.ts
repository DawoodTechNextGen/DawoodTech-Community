import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { ApprovePostDto } from './dto/approve-post.dto.js';
import { PostsService } from './posts.service.js';
export declare class AdminPostsController {
    private readonly posts;
    constructor(posts: PostsService);
    pending(): Promise<import("./post.mapper.js").PostResponse[]>;
    approve(id: string, admin: AuthenticatedUser, dto: ApprovePostDto): Promise<import("./post.mapper.js").PostResponse>;
    reject(id: string, admin: AuthenticatedUser): Promise<import("./post.mapper.js").PostResponse>;
}
