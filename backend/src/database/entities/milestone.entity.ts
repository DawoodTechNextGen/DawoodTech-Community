import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum MilestoneKind {
  JOINED = 'joined',
  /** No longer created (it came from TaskDesk); kept for posts that have it. */
  INTERNSHIP_COMPLETED = 'internship_completed',
}

/** A celebrated event — one row per event, so it's never posted twice. */
@Entity('milestones')
export class Milestone {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  /** Where the event came from, e.g. "welcome:12". */
  @Index({ unique: true })
  @Column({ name: 'source_key', length: 64 })
  sourceKey!: string;

  @Column({ type: 'enum', enum: MilestoneKind })
  kind!: MilestoneKind;

  @Index()
  @Column({ name: 'user_id', type: 'bigint' })
  userId!: number;

  @Column({ name: 'post_id', type: 'bigint', nullable: true })
  postId!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
