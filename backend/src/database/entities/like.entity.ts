import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Post } from './post.entity.js';
import { User } from './user.entity.js';

export enum Reaction {
  LIKE = 'like',
  CLAP = 'clap',
  CELEBRATE = 'celebrate',
  INSIGHTFUL = 'insightful',
  FIRE = 'fire',
}

/** One reaction per member per post (the table predates reactions, hence "likes"). */
@Entity('likes')
export class Like {
  @Index()
  @PrimaryColumn({ name: 'post_id', type: 'bigint' })
  postId!: number;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Relation<Post>;

  @PrimaryColumn({ name: 'user_id', type: 'bigint' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  @Column({ type: 'enum', enum: Reaction, default: Reaction.LIKE })
  reaction!: Reaction;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
