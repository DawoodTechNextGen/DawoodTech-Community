import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * users.verification_email_sent_at / verification_email_attempts, so a
 * verification email that failed at signup is retried by the app.
 *
 * Existing unverified members start with sent_at = NULL, so they each get one
 * fresh verification link after this deploys (their old links expired after
 * an hour anyway).
 */
export class VerificationEmailRetry1790500000000 implements MigrationInterface {
  name = 'VerificationEmailRetry1790500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Brand-new database: synchronize (dev) builds everything from the entities.
    if (!(await queryRunner.hasTable('users'))) return;

    if (!(await queryRunner.hasColumn('users', 'verification_email_sent_at'))) {
      await queryRunner.query(
        'ALTER TABLE `users` ADD COLUMN `verification_email_sent_at` DATETIME NULL DEFAULT NULL AFTER `is_email_verified`',
      );
    }
    if (!(await queryRunner.hasColumn('users', 'verification_email_attempts'))) {
      await queryRunner.query(
        'ALTER TABLE `users` ADD COLUMN `verification_email_attempts` INT NOT NULL DEFAULT 0 AFTER `verification_email_sent_at`',
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('users', 'verification_email_attempts')) {
      await queryRunner.query('ALTER TABLE `users` DROP COLUMN `verification_email_attempts`');
    }
    if (await queryRunner.hasColumn('users', 'verification_email_sent_at')) {
      await queryRunner.query('ALTER TABLE `users` DROP COLUMN `verification_email_sent_at`');
    }
  }
}
