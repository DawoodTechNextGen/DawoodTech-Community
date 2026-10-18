export class PushSubscriptions1790600000000 {
    name = 'PushSubscriptions1790600000000';
    async up(queryRunner) {
        if (!(await queryRunner.hasTable('users')))
            return;
        if (await queryRunner.hasTable('push_subscriptions'))
            return;
        await queryRunner.query(`
      CREATE TABLE \`push_subscriptions\` (
        \`id\` BIGINT NOT NULL AUTO_INCREMENT,
        \`user_id\` BIGINT NOT NULL,
        \`endpoint_hash\` CHAR(64) NOT NULL,
        \`endpoint\` TEXT NOT NULL,
        \`p256dh\` VARCHAR(255) NOT NULL,
        \`auth\` VARCHAR(255) NOT NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_push_subscriptions_endpoint_hash\` (\`endpoint_hash\`),
        KEY \`IDX_push_subscriptions_user_id\` (\`user_id\`),
        CONSTRAINT \`FK_push_subscriptions_user\` FOREIGN KEY (\`user_id\`)
          REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    }
    async down(queryRunner) {
        if (await queryRunner.hasTable('push_subscriptions')) {
            await queryRunner.query('DROP TABLE `push_subscriptions`');
        }
    }
}
//# sourceMappingURL=1790600000000-PushSubscriptions.js.map