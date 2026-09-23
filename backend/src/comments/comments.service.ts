import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../database/entities/comment.entity.js';
import { Post, PostStatus } from '../database/entities/post.entity.js';
import { NotificationEvents } from '../notifications/notification.events.js';
import type { CreateCommentDto } from './dto/create-comment.dto.js';
import { toCommentResponse, type CommentResponse } from './comment.mapper.js';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    private readonly events: EventEmitter2,
  ) {}

  async create(
    postId: number,
    userId: number,
    dto: CreateCommentDto,
  ): Promise<CommentResponse> {
    const post = await this.posts.findOneBy({ id: postId });
    if (!post || post.status !== PostStatus.APPROVED) {
      throw new NotFoundException('Post not found');
    }

    let parent: Comment | null = null;
    if (dto.parentId != null) {
      parent = await this.comments.findOneBy({ id: dto.parentId, postId });
      if (!parent) throw new NotFoundException('Comment being replied to was not found');
    }

    const comment = await this.comments.save(
      this.comments.create({
        postId,
        userId,
        content: dto.content,
        parentId: parent?.id ?? null,
      }),
    );
    const withAuthor = await this.comments.findOneOrFail({
      where: { id: comment.id },
      relations: { author: true },
    });

    if (parent) {
      this.events.emit(NotificationEvents.ReplyCreated, {
        postId,
        parentCommentAuthorId: parent.userId,
        actorId: userId,
      });
    }
    if (!parent || parent.userId !== post.userId) {
      this.events.emit(NotificationEvents.CommentCreated, {
        postId,
        postOwnerId: post.userId,
        actorId: userId,
      });
    }

    this.events.emit(NotificationEvents.CommentPosted, {
      postId,
      commentId: comment.id,
      postOwnerId: post.userId,
      parentCommentAuthorId: parent?.userId ?? null,
      actorId: userId,
    });

    return toCommentResponse(withAuthor, userId);
  }

  async findByPost(postId: number, viewerId?: number): Promise<CommentResponse[]> {
    const comments = await this.comments.find({
      where: { postId },
      relations: { author: true },
      order: { createdAt: 'ASC' },
    });
    return comments.map((c) => toCommentResponse(c, viewerId));
  }

  async remove(id: number, userId: number): Promise<void> {
    const comment = await this.comments.findOneBy({ id });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    await this.comments.remove(comment);
  }

  countsByPostIds(postIds: number[]): Promise<{ postId: string; count: string }[]> {
    if (postIds.length === 0) return Promise.resolve([]);
    return this.comments
      .createQueryBuilder('comment')
      .select('comment.postId', 'postId')
      .addSelect('COUNT(*)', 'count')
      .where('comment.postId IN (:...postIds)', { postIds })
      .groupBy('comment.postId')
      .getRawMany();
  }
}
