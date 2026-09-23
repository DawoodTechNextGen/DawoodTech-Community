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

export enum PostEmailStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  FAILED = 'failed',
  /** The post was unpublished before the worker reached it. */
  SKIPPED = 'skipped',
}

@Entity('post_email_queue')
@Index(['postId', 'email'], { unique: true })
export class PostEmailQueue {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Column({ name: 'post_id', type: 'bigint' })
  postId!: number;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Relation<Post>;

  @Column({ length: 255 })
  email!: string;

  @Column({ name: 'recipient_name', type: 'varchar', length: 255, nullable: true })
  recipientName!: string | null;

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
