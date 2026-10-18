import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { FollowsService } from '../follows/follows.service.js';
import { PostsService } from '../posts/posts.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UsersService } from './users.service.js';
export declare class UsersController {
    private readonly users;
    private readonly posts;
    private readonly follows;
    constructor(users: UsersService, posts: PostsService, follows: FollowsService);
    search(search?: string): Promise<import("./user.mapper.js").PublicUser[]>;
    suggestions(authUser: AuthenticatedUser): Promise<import("./user.mapper.js").PublicUser[]>;
    updateMe(authUser: AuthenticatedUser, dto: UpdateProfileDto): Promise<import("./user.mapper.js").SelfUser>;
    getByUsername(username: string): Promise<import("./user.mapper.js").PublicUser>;
    progress(authUser: AuthenticatedUser): Promise<{
        hasAvatar: boolean;
        hasBio: boolean;
        followingCount: number;
        postCount: number;
    }>;
    getById(id: number): Promise<import("./user.mapper.js").PublicUser>;
    getPostsByUser(id: number, authUser: AuthenticatedUser): Promise<import("../posts/post.mapper.js").PostResponse[]>;
}
