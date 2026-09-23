import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Post } from './post.entity.js';
import { PostEmailStatus } from './post-email-queue.entity.js';

export enum ActivityEmailType {
  /** Someone liked the recipient's post. */
  LIKE = 'like',
  /** Someone commented on the recipient's post. */
  COMMENT = 'comment',
  /** Someone replied to the recipient's comment. */
  REPLY = 'reply',
  /** Someone commented on a post the recipient had commented on earlier. */
  THREAD_COMMENT = 'thread_comment',
}

/** Emails to community members about activity on their posts/comments. */
@Entity('activity_email_queue')
export class ActivityEmailQueue {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  /** e.g. "like:<post>:<actor>:<recipient>" or "comment:<comment>:<recipient>" —
   *  makes enqueueing idempotent, so an unlike/re-like never emails twice. */
  @Index({ unique: true })
  @Column({ name: 'dedupe_key', length: 191 })
  dedupeKey!: string;

  @Index()
  @Column({ name: 'recipient_user_id', type: 'bigint' })
  recipientUserId!: number;

  @Column({ length: 255 })
  email!: string;

  @Column({ type: 'enum', enum: ActivityEmailType })
  type!: ActivityEmailType;

  @Column({ name: 'post_id', type: 'bigint' })
  postId!: number;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Relation<Post>;

  @Column({ name: 'actor_id', type: 'bigint' })
  actorId!: number;

  @Column({ name: 'comment_id', type: 'bigint', nullable: true })
  commentId!: number | null;

  @Index()
  @Column({ type: 'enum', enum: PostEmailStatus, default: PostEmailStatus.QUEUED })
  status!: PostEmailStatus;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ name: 'last_attempt_at', type: 'datetime', nullable: true })
  lastAttemptAt!: Date | null;

  @Column({ name: 'sent_at', type: 'datetime', nullable: true })
  sentAt!: Date | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  error!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
