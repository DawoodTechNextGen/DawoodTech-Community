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
import { User } from './user.entity.js';

/** One browser/device that agreed to receive Web Push for a member. */
@Entity('push_subscriptions')
export class PushSubscription {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Index()
  @Column({ name: 'user_id', type: 'bigint' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Relation<User>;

  /** Push service URLs can be long, so uniqueness is on their SHA-256. */
  @Index({ unique: true })
  @Column({ name: 'endpoint_hash', type: 'char', length: 64 })
  endpointHash!: string;

  @Column({ type: 'text' })
  endpoint!: string;

  @Column({ length: 255 })
  p256dh!: string;

  @Column({ length: 255 })
  auth!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
