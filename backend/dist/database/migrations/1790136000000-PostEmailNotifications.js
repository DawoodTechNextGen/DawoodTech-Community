export class PostEmailNotifications1790136000000 {
    name = 'PostEmailNotifications1790136000000';
    async up(queryRunner) {
        if (!(await queryRunner.hasTable('posts')))
            return;
        if (!(await queryRunner.hasColumn('posts', 'notified_at'))) {
            await queryRunner.query('ALTER TABLE `posts` ADD COLUMN `notified_at` DATETIME NULL DEFAULT NULL AFTER `reviewed_at`');
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
    async down(queryRunner) {
        await queryRunner.query('DROP TABLE IF EXISTS `post_email_queue`');
        if (await queryRunner.hasColumn('posts', 'notified_at')) {
            await queryRunner.query('ALTER TABLE `posts` DROP COLUMN `notified_at`');
        }
    }
}
//# sourceMappingURL=1790136000000-PostEmailNotifications.js.map