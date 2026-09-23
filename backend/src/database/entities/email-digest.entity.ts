import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** One daily "new posts" digest. Built at most once per calendar day. */
@Entity('email_digests')
export class EmailDigest {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  /** Local calendar day it was built for, "YYYY-MM-DD" (DIGEST_TIMEZONE).
   *  Unique, so a day can never get two digests. */
  @Index({ unique: true })
  @Column({ name: 'digest_key', length: 10 })
  digestKey!: string;

  /** Posts in this digest, oldest first. Empty on days with nothing new. */
  @Column({ name: 'post_ids', type: 'simple-json' })
  postIds!: number[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
