import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * New-post email notifications: posts.notified_at, post_email_queue.
 *
 * Runs automatically on app/CLI startup (migrationsRun), including production where
 * synchronize is off. Every step checks first, so it's safe against a database that
 * already has these objects (e.g. local dev, where synchronize created them).
 */
export class PostEmailNotifications1790136000000 implements MigrationInterface {
  name = 'PostEmailNotifications1790136000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Brand-new database: synchronize (dev) builds everything from the entities.
    if (!(await queryRunner.hasTable('posts'))) return;

    if (!(await queryRunner.hasColumn('posts', 'notified_at'))) {
      await queryRunner.query(
        'ALTER TABLE `posts` ADD COLUMN `notified_at` DATETIME NULL DEFAULT NULL AFTER `reviewed_at`',
      );
    }

    if (!(await queryRunner.hasTable('post_email_queue'))) {
      await queryRunner.query(`
        CREATE TABLE \`post_email_queue\` (
          \`id\` BIGINT NOT NULL AUTO_INCREMENT,
          \`post_id\` BIGINT NOT NULL,
          \`email\` VARCHAR(255) NOT NULL,
          \`recipient_name\` VARCHAR(255) NULL DEFAULT NULL,
          \`status\` ENUM('queued', 'sent', 'failed', 'skipped') NOT NULL DEFAULT 'queued',
          \`attempts\` INT NOT NULL DEFAULT 0,
          \`last_attempt_at\` DATETIME NULL DEFAULT NULL,
          \`sent_at\` DATETIME NULL DEFAULT NULL,
          \`error\` VARCHAR(1000) NULL DEFAULT NULL,
          \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uq_post_email_queue_post_email\` (\`post_id\`, \`email\`),
          KEY \`idx_post_email_queue_status\` (\`status\`),
          CONSTRAINT \`fk_post_email_queue_post\` FOREIGN KEY (\`post_id\`)
            REFERENCES \`posts\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    }

  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `post_email_queue`');
    if (await queryRunner.hasColumn('posts', 'notified_at')) {
      await queryRunner.query('ALTER TABLE `posts` DROP COLUMN `notified_at`');
    }
  }
}
