import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { CommentsService } from '../comments/comments.service.js';
import { FollowsService } from '../follows/follows.service.js';
import { LikesService } from '../likes/likes.service.js';
import { PostMedia } from '../database/entities/post-media.entity.js';
import { Post } from '../database/entities/post.entity.js';
import type { CreatePostDto } from './dto/create-post.dto.js';
import type { UpdatePostDto } from './dto/update-post.dto.js';
import { type PostResponse } from './post.mapper.js';
export declare class PostsService {
    private readonly posts;
    private readonly postMedia;
    private readonly followsService;
    private readonly likesService;
    private readonly commentsService;
    private readonly events;
    constructor(posts: Repository<Post>, postMedia: Repository<PostMedia>, followsService: FollowsService, likesService: LikesService, commentsService: CommentsService, events: EventEmitter2);
    create(userId: number, dto: CreatePostDto): Promise<PostResponse>;
    findFeed(cursor?: string, viewerId?: number): Promise<{
        items: PostResponse[];
        nextCursor: string | null;
    }>;
    findExplore(cursor?: string, viewerId?: number): Promise<{
        items: PostResponse[];
        nextCursor: string | null;
    }>;
    findByUser(userId: number, viewerId?: number): Promise<PostResponse[]>;
    getByIdOrFail(id: number, viewerId?: number): Promise<PostResponse>;
    updateOwn(id: number, userId: number, dto: UpdatePostDto): Promise<PostResponse>;
    deleteOwn(id: number, userId: number): Promise<void>;
    findPending(): Promise<PostResponse[]>;
    approve(id: number, adminId: number, notifyInterns?: boolean): Promise<PostResponse>;
    reject(id: number, adminId: number): Promise<PostResponse>;
    private review;
    private attachEngagement;
}
