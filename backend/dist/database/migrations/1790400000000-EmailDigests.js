export class EmailDigests1790400000000 {
    name = 'EmailDigests1790400000000';
    async up(queryRunner) {
        if (!(await queryRunner.hasTable('posts')))
            return;
        if (!(await queryRunner.hasColumn('posts', 'notify_by_email'))) {
            await queryRunner.query('ALTER TABLE `posts` ADD COLUMN `notify_by_email` TINYINT(1) NOT NULL DEFAULT 0 AFTER `reviewed_at`');
        }
        if (!(await queryRunner.hasTable('email_digests'))) {
            await queryRunner.query(`
        CREATE TABLE \`email_digests\` (
          \`id\` BIGINT NOT NULL AUTO_INCREMENT,
          \`digest_key\` VARCHAR(10) NOT NULL,
          \`post_ids\` TEXT NOT NULL,
          \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uq_email_digests_digest_key\` (\`digest_key\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
        }
        if (!(await queryRunner.hasTable('digest_email_queue'))) {
            await queryRunner.query(`
        CREATE TABLE \`digest_email_queue\` (
          \`id\` BIGINT NOT NULL AUTO_INCREMENT,
          \`digest_id\` BIGINT NOT NULL,
          \`email\` VARCHAR(255) NOT NULL,
          \`recipient_name\` VARCHAR(255) NULL DEFAULT NULL,
          \`status\` ENUM('queued', 'sent', 'failed', 'skipped') NOT NULL DEFAULT 'queued',
          \`attempts\` INT NOT NULL DEFAULT 0,
          \`last_attempt_at\` DATETIME NULL DEFAULT NULL,
          \`sent_at\` DATETIME NULL DEFAULT NULL,
          \`error\` VARCHAR(1000) NULL DEFAULT NULL,
          \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uq_digest_email_queue_digest_email\` (\`digest_id\`, \`email\`),
          KEY \`idx_digest_email_queue_status\` (\`status\`),
          CONSTRAINT \`fk_digest_email_queue_digest\` FOREIGN KEY (\`digest_id\`)
            REFERENCES \`email_digests\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
        }
    }
    async down(queryRunner) {
        await queryRunner.query('DROP TABLE IF EXISTS `digest_email_queue`');
        await queryRunner.query('DROP TABLE IF EXISTS `email_digests`');
        if (await queryRunner.hasColumn('posts', 'notify_by_email')) {
            await queryRunner.query('ALTER TABLE `posts` DROP COLUMN `notify_by_email`');
        }
    }
}
//# sourceMappingURL=1790400000000-EmailDigests.js.map