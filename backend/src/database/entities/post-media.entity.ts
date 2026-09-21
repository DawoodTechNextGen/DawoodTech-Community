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

@Entity('post_media')
export class PostMedia {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Index()
  @Column({ name: 'post_id', type: 'bigint' })
  postId!: number;

  @ManyToOne(() => Post, (post) => post.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Relation<Post>;

  @Column({ length: 500 })
  url!: string;

  @Column({ name: 'media_type', type: 'enum', enum: ['image'], default: 'image' })
  mediaType!: 'image';

  @Column({ name: 'sort_order', type: 'tinyint', unsigned: true, default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
