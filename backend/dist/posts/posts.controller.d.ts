import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
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
    questions(user: AuthenticatedUser, cursor?: string): Promise<{
        items: import("./post.mapper.js").PostResponse[];
        nextCursor: string | null;
    }>;
    trendingTags(): Promise<{
        tag: string;
        count: number;
    }[]>;
    byTag(tag: string, user: AuthenticatedUser, cursor?: string): Promise<{
        items: import("./post.mapper.js").PostResponse[];
        nextCursor: string | null;
    }>;
    search(user: AuthenticatedUser, q?: string): Promise<never[] | import("./post.mapper.js").PostResponse[]>;
    pinned(user: AuthenticatedUser): Promise<import("./post.mapper.js").PostResponse[]>;
    getOne(id: number, user: AuthenticatedUser): Promise<import("./post.mapper.js").PostResponse>;
    update(id: number, user: AuthenticatedUser, dto: UpdatePostDto): Promise<import("./post.mapper.js").PostResponse>;
    remove(id: number, user: AuthenticatedUser): Promise<void>;
}
