import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { User } from './user.entity.js';
import { PostMedia } from './post-media.entity.js';
import { MilestoneKind } from './milestone.entity.js';

export enum PostStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Index()
  @Column({ name: 'user_id', type: 'bigint' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  author!: Relation<User>;

  @Column({ type: 'text' })
  content!: string;

  @Index()
  @Column({ type: 'enum', enum: PostStatus, default: PostStatus.PENDING })
  status!: PostStatus;

  @Column({ name: 'reviewed_by', type: 'bigint', nullable: true })
  reviewedBy!: number | null;

  @Column({ name: 'reviewed_at', type: 'datetime', nullable: true })
  reviewedAt!: Date | null;

  /** Local day ("YYYY-MM-DD") of the daily question this post answers. */
  @Index()
  @Column({ name: 'prompt_day', type: 'char', length: 10, nullable: true })
  promptDay!: string | null;

  /** The question itself, kept with the post so it reads right forever. */
  @Column({ name: 'prompt_text', type: 'varchar', length: 255, nullable: true })
  promptText!: string | null;

  /** Asked as a question: answers are comments, and the author can accept one. */
  @Index()
  @Column({ name: 'is_question', type: 'boolean', default: false })
  isQuestion!: boolean;

  /** Pinned to the top of everyone's feed by an admin (newest pin first). */
  @Index()
  @Column({ name: 'pinned_at', type: 'datetime', nullable: true })
  pinnedAt!: Date | null;

  /** Set on the celebration post the app writes for a member's milestone. */
  @Column({ type: 'enum', enum: MilestoneKind, nullable: true })
  milestone!: MilestoneKind | null;

  @OneToMany(() => PostMedia, (media) => media.post)
  media!: Relation<PostMedia>[];

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
