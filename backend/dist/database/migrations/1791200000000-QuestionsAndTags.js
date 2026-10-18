export class QuestionsAndTags1791200000000 {
    name = 'QuestionsAndTags1791200000000';
    async up(queryRunner) {
        if (!(await queryRunner.hasTable('posts')))
            return;
        if (!(await queryRunner.hasColumn('posts', 'is_question'))) {
            await queryRunner.query('ALTER TABLE `posts` ADD COLUMN `is_question` TINYINT(1) NOT NULL DEFAULT 0, ADD INDEX `IDX_posts_is_question` (`is_question`)');
        }
        if (!(await queryRunner.hasColumn('comments', 'accepted_at'))) {
            await queryRunner.query('ALTER TABLE `comments` ADD COLUMN `accepted_at` DATETIME NULL DEFAULT NULL');
        }
        if (!(await queryRunner.hasTable('post_tags'))) {
            await queryRunner.query(`
        CREATE TABLE \`post_tags\` (
          \`post_id\` BIGINT NOT NULL,
          \`tag\` VARCHAR(50) NOT NULL,
          \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`post_id\`, \`tag\`),
          KEY \`IDX_post_tags_tag\` (\`tag\`),
          CONSTRAINT \`FK_post_tags_post\` FOREIGN KEY (\`post_id\`)
            REFERENCES \`posts\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
        }
        await queryRunner.query("ALTER TABLE `notifications` MODIFY `type` ENUM('comment','reply','follow','like','post_approved','post_rejected','mention','announcement','answer_accepted') NOT NULL");
    }
    async down(queryRunner) {
        await queryRunner.query("DELETE FROM `notifications` WHERE `type` = 'answer_accepted'");
        await queryRunner.query("ALTER TABLE `notifications` MODIFY `type` ENUM('comment','reply','follow','like','post_approved','post_rejected','mention','announcement') NOT NULL");
        if (await queryRunner.hasTable('post_tags'))
            await queryRunner.query('DROP TABLE `post_tags`');
        if (await queryRunner.hasColumn('comments', 'accepted_at')) {
            await queryRunner.query('ALTER TABLE `comments` DROP COLUMN `accepted_at`');
        }
        if (await queryRunner.hasColumn('posts', 'is_question')) {
            await queryRunner.query('ALTER TABLE `posts` DROP INDEX `IDX_posts_is_question`, DROP COLUMN `is_question`');
        }
    }
}
//# sourceMappingURL=1791200000000-QuestionsAndTags.js.map