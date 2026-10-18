import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Post } from './post.entity.js';

/** A #hashtag used in a post (lowercase, without the #). */
@Entity('post_tags')
export class PostTag {
  @PrimaryColumn({ name: 'post_id', type: 'bigint' })
  postId!: number;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Relation<Post>;

  @Index()
  @PrimaryColumn({ length: 50 })
  tag!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
