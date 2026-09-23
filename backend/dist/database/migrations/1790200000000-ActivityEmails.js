export class ActivityEmails1790200000000 {
    name = 'ActivityEmails1790200000000';
    async up(queryRunner) {
        if (!(await queryRunner.hasTable('posts')))
            return;
        if (await queryRunner.hasTable('activity_email_queue'))
            return;
        await queryRunner.query(`
      CREATE TABLE \`activity_email_queue\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`dedupe_key\` VARCHAR(191) NOT NULL,
        \`recipient_user_id\` BIGINT NOT NULL,
        \`email\` VARCHAR(255) NOT NULL,
        \`type\` ENUM('like', 'comment', 'reply', 'thread_comment') NOT NULL,
        \`post_id\` BIGINT NOT NULL,
        \`actor_id\` BIGINT NOT NULL,
        \`comment_id\` BIGINT NULL DEFAULT NULL,
        \`status\` ENUM('queued', 'sent', 'failed', 'skipped') NOT NULL DEFAULT 'queued',
        \`attempts\` INT NOT NULL DEFAULT 0,
        \`last_attempt_at\` DATETIME NULL DEFAULT NULL,
        \`sent_at\` DATETIME NULL DEFAULT NULL,
        \`error\` VARCHAR(1000) NULL DEFAULT NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_activity_email_queue_dedupe\` (\`dedupe_key\`),
        KEY \`idx_activity_email_queue_recipient\` (\`recipient_user_id\`),
        KEY \`idx_activity_email_queue_status\` (\`status\`),
        CONSTRAINT \`fk_activity_email_queue_post\` FOREIGN KEY (\`post_id\`)
          REFERENCES \`posts\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    }
    async down(queryRunner) {
        await queryRunner.query('DROP TABLE IF EXISTS `activity_email_queue`');
    }
}
//# sourceMappingURL=1790200000000-ActivityEmails.js.map