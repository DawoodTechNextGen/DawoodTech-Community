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
import { User } from './user.entity.js';

export enum NotificationType {
  COMMENT = 'comment',
  REPLY = 'reply',
  FOLLOW = 'follow',
  LIKE = 'like',
  POST_APPROVED = 'post_approved',
  POST_REJECTED = 'post_rejected',
  MENTION = 'mention',
  ANNOUNCEMENT = 'announcement',
  ANSWER_ACCEPTED = 'answer_accepted',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Index()
  @Column({ name: 'recipient_id', type: 'bigint' })
  recipientId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_id' })
  recipient!: Relation<User>;

  @Column({ name: 'actor_id', type: 'bigint' })
  actorId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actor_id' })
  actor!: Relation<User>;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ name: 'post_id', type: 'bigint', nullable: true })
  postId!: number | null;

  @ManyToOne(() => Post, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'post_id' })
  post!: Relation<Post> | null;

  @Column({ name: 'is_read', default: false })
  isRead!: boolean;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
