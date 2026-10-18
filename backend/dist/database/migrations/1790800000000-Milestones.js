export class Milestones1790800000000 {
    name = 'Milestones1790800000000';
    async up(queryRunner) {
        if (!(await queryRunner.hasTable('posts')))
            return;
        if (!(await queryRunner.hasColumn('posts', 'milestone'))) {
            await queryRunner.query("ALTER TABLE `posts` ADD COLUMN `milestone` ENUM('joined','internship_completed') NULL DEFAULT NULL");
        }
        if (!(await queryRunner.hasTable('milestones'))) {
            await queryRunner.query(`
        CREATE TABLE \`milestones\` (
          \`id\` BIGINT NOT NULL AUTO_INCREMENT,
          \`source_key\` VARCHAR(64) NOT NULL,
          \`kind\` ENUM('joined','internship_completed') NOT NULL,
          \`user_id\` BIGINT NOT NULL,
          \`post_id\` BIGINT NULL DEFAULT NULL,
          \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`UQ_milestones_source_key\` (\`source_key\`),
          KEY \`IDX_milestones_user_id\` (\`user_id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
        }
    }
    async down(queryRunner) {
        if (await queryRunner.hasTable('milestones')) {
            await queryRunner.query('DROP TABLE `milestones`');
        }
        if (await queryRunner.hasColumn('posts', 'milestone')) {
            await queryRunner.query('ALTER TABLE `posts` DROP COLUMN `milestone`');
        }
    }
}
//# sourceMappingURL=1790800000000-Milestones.js.map