import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { PostsService } from './posts.service.js';
export declare class PostsController {
    private readonly posts;
    constructor(posts: PostsService);
    create(user: AuthenticatedUser, dto: CreatePostDto): Promise<import("./post.mapper.js").PostResponse>;
    feed(user: AuthenticatedUser, cursor?: string): Promise<{
        items: import("./post.mapper.js").PostResponse[];
        nextCursor: string | null;
    }>;
    explore(user: AuthenticatedUser, cursor?: string): Promise<{
        items: import("./post.mapper.js").PostResponse[];
        nextCursor: string | null;
    }>;
    getOne(id: string, user: AuthenticatedUser): Promise<import("./post.mapper.js").PostResponse>;
    remove(id: string, user: AuthenticatedUser): Promise<void>;
}
