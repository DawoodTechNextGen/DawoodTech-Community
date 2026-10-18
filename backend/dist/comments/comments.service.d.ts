import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { Comment } from '../database/entities/comment.entity.js';
import { Post } from '../database/entities/post.entity.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import type { CreateCommentDto } from './dto/create-comment.dto.js';
import { type CommentResponse } from './comment.mapper.js';
export declare class CommentsService {
    private readonly comments;
    private readonly posts;
    private readonly events;
    constructor(comments: Repository<Comment>, posts: Repository<Post>, events: EventEmitter2);
    create(postId: number, userId: number, dto: CreateCommentDto): Promise<CommentResponse>;
    findByPost(postId: number, viewerId?: number): Promise<CommentResponse[]>;
    remove(id: number, actor: AuthenticatedUser): Promise<void>;
    accept(id: number, actor: AuthenticatedUser): Promise<CommentResponse>;
    postIdsWithAcceptedAnswer(postIds: number[]): Promise<Set<number>>;
    countsByPostIds(postIds: number[]): Promise<{
        postId: string;
        count: string;
    }[]>;
}
