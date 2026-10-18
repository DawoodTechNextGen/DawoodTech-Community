import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { Like, Reaction } from '../database/entities/like.entity.js';
import { Post } from '../database/entities/post.entity.js';
import { User } from '../database/entities/user.entity.js';
import { type PublicUser } from '../users/user.mapper.js';
export declare class LikesService {
    private readonly likes;
    private readonly posts;
    private readonly users;
    private readonly events;
    constructor(likes: Repository<Like>, posts: Repository<Post>, users: Repository<User>, events: EventEmitter2);
    like(postId: number, userId: number, reaction?: Reaction): Promise<void>;
    unlike(postId: number, userId: number): Promise<void>;
    listLikers(postId: number): Promise<PublicUser[]>;
    countsByPostIds(postIds: number[]): Promise<{
        postId: string;
        reaction: Reaction;
        count: string;
    }[]>;
    reactionsByUser(userId: number, postIds: number[]): Promise<Map<number, Reaction>>;
}
