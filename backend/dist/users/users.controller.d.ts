import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { PostsService } from '../posts/posts.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UsersService } from './users.service.js';
export declare class UsersController {
    private readonly users;
    private readonly posts;
    constructor(users: UsersService, posts: PostsService);
    search(search?: string): Promise<import("./user.mapper.js").PublicUser[]>;
    updateMe(authUser: AuthenticatedUser, dto: UpdateProfileDto): Promise<import("./user.mapper.js").PublicUser>;
    getByUsername(username: string): Promise<import("./user.mapper.js").PublicUser>;
    getById(id: string): Promise<import("./user.mapper.js").PublicUser>;
    getPostsByUser(id: string, authUser: AuthenticatedUser): Promise<import("../posts/post.mapper.js").PostResponse[]>;
}
