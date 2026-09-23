import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  INTERN = 'intern',
  SUPERVISOR = 'supervisor',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Index({ unique: true })
  @Column({ length: 255 })
  email!: string;

  @Index({ unique: true })
  @Column({ length: 50 })
  username!: string;

  @Column({ name: 'password_hash', length: 255, select: false })
  passwordHash!: string;

  @Column({ name: 'full_name', length: 150 })
  fullName!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  bio!: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.INTERN })
  role!: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified!: boolean;

  /** Last time a verification email actually went out. Null while unverified
   *  means it never did (e.g. the mail server was busy at signup), so the app
   *  retries it on startup and every few minutes. */
  @Column({ name: 'verification_email_sent_at', type: 'datetime', nullable: true })
  verificationEmailSentAt!: Date | null;

  /** Failed verification-email sends; retries stop after a few. */
  @Column({ name: 'verification_email_attempts', type: 'int', default: 0 })
  verificationEmailAttempts!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
