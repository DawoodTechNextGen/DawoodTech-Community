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

  /** Approved with "email everyone" ticked — goes into the next daily digest. */
  @Column({ name: 'notify_by_email', type: 'boolean', default: false })
  notifyByEmail!: boolean;

  /** When the post went out by email (in a digest); set once, never reset. */
  @Column({ name: 'notified_at', type: 'datetime', nullable: true })
  notifiedAt!: Date | null;

  @OneToMany(() => PostMedia, (media) => media.post)
  media!: Relation<PostMedia>[];

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
