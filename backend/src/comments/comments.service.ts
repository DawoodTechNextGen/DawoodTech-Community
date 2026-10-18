import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../database/entities/comment.entity.js';
import { Post, PostStatus } from '../database/entities/post.entity.js';
import { UserRole } from '../database/entities/user.entity.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { NotificationEvents } from '../notifications/notification.events.js';
import type { CreateCommentDto } from './dto/create-comment.dto.js';
import { toCommentResponse, type CommentResponse } from './comment.mapper.js';
import { sameId } from '../common/same-id.js';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    private readonly events: EventEmitter2,
  ) {}

  async create(postId: number, userId: number, dto: CreateCommentDto): Promise<CommentResponse> {
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

    this.events.emit(NotificationEvents.MentionsPublished, {
      postId,
      actorId: userId,
      text: dto.content,
      // They already hear about this comment as its post's owner / the parent's author.
      skipUserIds: [post.userId, ...(parent ? [parent.userId] : [])],
    });

    if (parent) {
      this.events.emit(NotificationEvents.ReplyCreated, {
        postId,
        parentCommentAuthorId: parent.userId,
        actorId: userId,
      });
    }
    if (!parent || !sameId(parent.userId, post.userId)) {
      this.events.emit(NotificationEvents.CommentCreated, {
        postId,
        postOwnerId: post.userId,
        actorId: userId,
      });
    }

    return toCommentResponse(withAuthor, userId);
  }

  async findByPost(postId: number, viewerId?: number): Promise<CommentResponse[]> {
    // Same visibility as the post itself: a pending or rejected post's
    // comments are only for its author.
    const post = await this.posts.findOneBy({ id: postId });
    if (!post || (post.status !== PostStatus.APPROVED && !sameId(post.userId, viewerId))) {
      throw new NotFoundException('Post not found');
    }
    const comments = await this.comments.find({
      where: { postId },
      relations: { author: true },
      order: { createdAt: 'ASC' },
    });
    return comments.map((c) => toCommentResponse(c, viewerId));
  }

  /** A comment can be removed by its author, the post's author, or an admin. */
  async remove(id: number, actor: AuthenticatedUser): Promise<void> {
    const comment = await this.comments.findOne({
      where: { id },
      relations: { post: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    const allowed =
      sameId(comment.userId, actor.id) ||
      sameId(comment.post?.userId, actor.id) ||
      actor.role === UserRole.ADMIN;
    if (!allowed) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    await this.comments.remove(comment);
  }

  /** The question's author marks one comment as the answer (or clears it by
   *  accepting the same one again). */
  async accept(id: number, actor: AuthenticatedUser): Promise<CommentResponse> {
    const comment = await this.comments.findOne({ where: { id }, relations: { post: true } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (!comment.post?.isQuestion)
      throw new BadRequestException('Only answers to a question can be accepted');
    if (!sameId(comment.post.userId, actor.id)) {
      throw new ForbiddenException('Only the person who asked can accept an answer');
    }

    const wasAccepted = comment.acceptedAt !== null;
    await this.comments.update({ postId: comment.postId }, { acceptedAt: null });
    if (!wasAccepted) {
      await this.comments.update({ id }, { acceptedAt: new Date() });
      this.events.emit(NotificationEvents.AnswerAccepted, {
        postId: comment.postId,
        answerAuthorId: comment.userId,
        actorId: actor.id,
      });
    }
    const updated = await this.comments.findOneOrFail({
      where: { id },
      relations: { author: true },
    });
    return toCommentResponse(updated, actor.id);
  }

  /** Which of these questions have an accepted answer. */
  async postIdsWithAcceptedAnswer(postIds: number[]): Promise<Set<number>> {
    if (postIds.length === 0) return new Set();
    const rows = await this.comments
      .createQueryBuilder('comment')
      .select('DISTINCT comment.postId', 'postId')
      .where('comment.postId IN (:...postIds)', { postIds })
      .andWhere('comment.acceptedAt IS NOT NULL')
      .getRawMany<{ postId: string }>();
    return new Set(rows.map((r) => Number(r.postId)));
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
