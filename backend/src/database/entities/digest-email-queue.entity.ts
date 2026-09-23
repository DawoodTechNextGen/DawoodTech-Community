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
import { EmailDigest } from './email-digest.entity.js';
import { PostEmailStatus } from './post-email-queue.entity.js';

/** One daily-digest email to one address. */
@Entity('digest_email_queue')
@Index(['digestId', 'email'], { unique: true })
export class DigestEmailQueue {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Column({ name: 'digest_id', type: 'bigint' })
  digestId!: number;

  @ManyToOne(() => EmailDigest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'digest_id' })
  digest!: Relation<EmailDigest>;

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
