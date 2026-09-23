import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommentsService } from '../comments/comments.service.js';
import { FollowsService } from '../follows/follows.service.js';
import { LikesService } from '../likes/likes.service.js';
import { PostMedia } from '../database/entities/post-media.entity.js';
import { Post, PostStatus } from '../database/entities/post.entity.js';
import { NotificationEvents } from '../notifications/notification.events.js';
import { PostEmailEvents } from '../post-emails/post-email.events.js';
import type { CreatePostDto } from './dto/create-post.dto.js';
import type { UpdatePostDto } from './dto/update-post.dto.js';
import { toPostResponse, type PostResponse } from './post.mapper.js';

const PAGE_SIZE = 20;

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(PostMedia)
    private readonly postMedia: Repository<PostMedia>,
    private readonly followsService: FollowsService,
    private readonly likesService: LikesService,
    private readonly commentsService: CommentsService,
    private readonly events: EventEmitter2,
  ) {}

  async create(userId: number, dto: CreatePostDto): Promise<PostResponse> {
    const post = await this.posts.save(
      this.posts.create({
        userId,
        content: dto.content,
        status: PostStatus.PENDING,
      }),
    );

    if (dto.mediaUrls?.length) {
      await this.postMedia.save(
        dto.mediaUrls.map((url, index) =>
          this.postMedia.create({ postId: post.id, url, sortOrder: index }),
        ),
      );
    }

    return this.getByIdOrFail(post.id, userId);
  }

  /** Follow-personalized feed; falls back to explore when the viewer follows
   *  no one yet, so onboarding never shows an empty feed. */
  async findFeed(cursor?: string, viewerId?: number) {
    if (!viewerId) return this.findExplore(cursor, viewerId);

    const followedIds = await this.followsService.getFollowedIds(viewerId);
    if (followedIds.length === 0) return this.findExplore(cursor, viewerId);

    const authorIds = [...followedIds, viewerId];
    const qb = this.posts
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.media', 'media')
      .where('post.status = :status', { status: PostStatus.APPROVED })
      .andWhere('post.userId IN (:...authorIds)', { authorIds })
      .orderBy('post.createdAt', 'DESC')
      .take(PAGE_SIZE);

    if (cursor) {
      qb.andWhere('post.createdAt < :cursor', { cursor: new Date(cursor) });
    }

    const posts = await qb.getMany();
    const items = await this.attachEngagement(
      posts.map((p) => toPostResponse(p, viewerId)),
      viewerId,
    );
    return {
      items,
      nextCursor:
        posts.length === PAGE_SIZE
          ? posts[posts.length - 1]!.createdAt.toISOString()
          : null,
    };
  }

  async findExplore(cursor?: string, viewerId?: number) {
    const qb = this.posts
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.media', 'media')
      .where('post.status = :status', { status: PostStatus.APPROVED })
      .orderBy('post.createdAt', 'DESC')
      .take(PAGE_SIZE);

    if (cursor) {
      qb.andWhere('post.createdAt < :cursor', { cursor: new Date(cursor) });
    }

    const posts = await qb.getMany();
    const items = await this.attachEngagement(
      posts.map((p) => toPostResponse(p, viewerId)),
      viewerId,
    );
    return {
      items,
      nextCursor:
        posts.length === PAGE_SIZE
          ? posts[posts.length - 1]!.createdAt.toISOString()
          : null,
    };
  }

  async findByUser(userId: number, viewerId?: number): Promise<PostResponse[]> {
    const qb = this.posts
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.media', 'media')
      .where('post.userId = :userId', { userId })
      .orderBy('post.createdAt', 'DESC');

    if (viewerId !== userId) {
      qb.andWhere('post.status = :status', { status: PostStatus.APPROVED });
    }

    const posts = await qb.getMany();
    return this.attachEngagement(
      posts.map((p) => toPostResponse(p, viewerId)),
      viewerId,
    );
  }

  async getByIdOrFail(id: number, viewerId?: number): Promise<PostResponse> {
    const post = await this.posts.findOne({
      where: { id },
      relations: { author: true, media: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.status !== PostStatus.APPROVED && post.userId !== viewerId) {
      throw new NotFoundException('Post not found');
    }
    const [withEngagement] = await this.attachEngagement(
      [toPostResponse(post, viewerId)],
      viewerId,
    );
    return withEngagement!;
  }

  /** Editing content sends an already-approved post back through moderation,
   *  so an edit can't be used to slip unreviewed content past the queue. */
  async updateOwn(id: number, userId: number, dto: UpdatePostDto): Promise<PostResponse> {
    const post = await this.posts.findOneBy({ id });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    post.content = dto.content;
    post.status = PostStatus.PENDING;
    post.reviewedBy = null;
    post.reviewedAt = null;
    await this.posts.save(post);

    if (dto.mediaUrls) {
      await this.postMedia.delete({ postId: id });
      if (dto.mediaUrls.length) {
        await this.postMedia.save(
          dto.mediaUrls.map((url, index) =>
            this.postMedia.create({ postId: id, url, sortOrder: index }),
          ),
        );
      }
    }

    return this.getByIdOrFail(id, userId);
  }

  async deleteOwn(id: number, userId: number): Promise<void> {
    const post = await this.posts.findOneBy({ id });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }
    await this.posts.remove(post);
  }

  // --- Admin moderation ---

  async findPending(): Promise<PostResponse[]> {
    const posts = await this.posts.find({
      where: { status: PostStatus.PENDING },
      relations: { author: true, media: true },
      order: { createdAt: 'ASC' },
    });
    return posts.map((p) => toPostResponse(p));
  }

  async approve(id: number, adminId: number, notifyInterns = true): Promise<PostResponse> {
    const response = await this.review(id, adminId, PostStatus.APPROVED);
    // Fire-and-forget: the listener fetches TaskDesk recipients and fills the
    // email queue, and skips posts that were already notified (e.g. re-approval
    // after an edit), so the approve request never waits on email.
    if (notifyInterns) {
      this.events.emit(PostEmailEvents.PostPublished, { postId: id });
    }
    return response;
  }

  async reject(id: number, adminId: number): Promise<PostResponse> {
    return this.review(id, adminId, PostStatus.REJECTED);
  }

  private async review(
    id: number,
    adminId: number,
    status: PostStatus.APPROVED | PostStatus.REJECTED,
  ): Promise<PostResponse> {
    const post = await this.posts.findOne({
      where: { id },
      relations: { author: true, media: true },
    });
    if (!post) throw new NotFoundException('Post not found');

    post.status = status;
    post.reviewedBy = adminId;
    post.reviewedAt = new Date();
    await this.posts.save(post);

    this.events.emit(
      status === PostStatus.APPROVED
        ? NotificationEvents.PostApproved
        : NotificationEvents.PostRejected,
      { postId: post.id, authorId: post.userId, adminId },
    );

    return toPostResponse(post, post.userId);
  }

  private async attachEngagement(
    items: PostResponse[],
    viewerId?: number,
  ): Promise<PostResponse[]> {
    if (items.length === 0) return items;
    const postIds = items.map((i) => Number(i.id));

    const [likeCounts, commentCounts, likedIds] = await Promise.all([
      this.likesService.countsByPostIds(postIds),
      this.commentsService.countsByPostIds(postIds),
      viewerId
        ? this.likesService.likedPostIdsByUser(viewerId, postIds)
        : Promise.resolve(new Set<number>()),
    ]);

    const likeMap = new Map(likeCounts.map((r) => [Number(r.postId), Number(r.count)]));
    const commentMap = new Map(
      commentCounts.map((r) => [Number(r.postId), Number(r.count)]),
    );

    return items.map((item) => ({
      ...item,
      likeCount: likeMap.get(Number(item.id)) ?? 0,
      commentCount: commentMap.get(Number(item.id)) ?? 0,
      likedByMe: likedIds.has(Number(item.id)),
    }));
  }
}
