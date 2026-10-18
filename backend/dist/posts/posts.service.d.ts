import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { CommentsService } from '../comments/comments.service.js';
import { FollowsService } from '../follows/follows.service.js';
import { LikesService } from '../likes/likes.service.js';
import { PostMedia } from '../database/entities/post-media.entity.js';
import { PostTag } from '../database/entities/post-tag.entity.js';
import { Post } from '../database/entities/post.entity.js';
import { User } from '../database/entities/user.entity.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import type { CreatePostDto } from './dto/create-post.dto.js';
import type { UpdatePostDto } from './dto/update-post.dto.js';
import { type PostResponse } from './post.mapper.js';
export declare class PostsService {
    private readonly posts;
    private readonly postMedia;
    private readonly postTags;
    private readonly followsService;
    private readonly likesService;
    private readonly commentsService;
    private readonly events;
    private readonly users;
    private readonly config;
    constructor(posts: Repository<Post>, postMedia: Repository<PostMedia>, postTags: Repository<PostTag>, followsService: FollowsService, likesService: LikesService, commentsService: CommentsService, events: EventEmitter2, users: Repository<User>, config: ConfigService);
    private isTrusted;
    private initialReview;
    private announceMentions;
    private announce;
    create(userId: number, dto: CreatePostDto): Promise<PostResponse>;
    findFeed(cursor?: string, viewerId?: number): Promise<{
        items: PostResponse[];
        nextCursor: string | null;
    }>;
    findExplore(cursor?: string, viewerId?: number): Promise<{
        items: PostResponse[];
        nextCursor: string | null;
    }>;
    findQuestions(cursor?: string, viewerId?: number): Promise<{
        items: PostResponse[];
        nextCursor: string | null;
    }>;
    findByTag(tag: string, cursor?: string, viewerId?: number): Promise<{
        items: PostResponse[];
        nextCursor: string | null;
    }>;
    search(query: string, viewerId?: number): Promise<PostResponse[]>;
    trendingTags(days?: number, limit?: number): Promise<{
        tag: string;
        count: number;
    }[]>;
    private approvedPosts;
    private page;
    private saveTags;
    findByUser(userId: number, viewerId?: number): Promise<PostResponse[]>;
    countByUser(userId: number): Promise<number>;
    getByIdOrFail(id: number, viewerId?: number): Promise<PostResponse>;
    updateOwn(id: number, userId: number, dto: UpdatePostDto): Promise<PostResponse>;
    delete(id: number, actor: AuthenticatedUser): Promise<void>;
    reviewStats(): Promise<{
        pending: number;
        avgWaitMinutes: number | null;
        reviewed30d: number;
    }>;
    findPinned(viewerId?: number): Promise<PostResponse[]>;
    setPinned(id: number, adminId: number, pinned: boolean, notifyAll?: boolean): Promise<PostResponse>;
    findPending(): Promise<PostResponse[]>;
    approve(id: number, adminId: number): Promise<PostResponse>;
    reject(id: number, adminId: number): Promise<PostResponse>;
    private review;
    private attachEngagement;
}
