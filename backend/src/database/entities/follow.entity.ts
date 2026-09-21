import {
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { User } from './user.entity.js';

@Entity('follows')
export class Follow {
  @Index()
  @PrimaryColumn({ name: 'follower_id', type: 'bigint' })
  followerId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  follower!: Relation<User>;

  @Index()
  @PrimaryColumn({ name: 'following_id', type: 'bigint' })
  followingId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_id' })
  following!: Relation<User>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
