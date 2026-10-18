export class DailyPrompts1790700000000 {
    name = 'DailyPrompts1790700000000';
    async up(queryRunner) {
        if (!(await queryRunner.hasTable('posts')))
            return;
        if (!(await queryRunner.hasColumn('posts', 'prompt_day'))) {
            await queryRunner.query('ALTER TABLE `posts` ADD COLUMN `prompt_day` CHAR(10) NULL DEFAULT NULL, ADD INDEX `IDX_posts_prompt_day` (`prompt_day`)');
        }
        if (!(await queryRunner.hasColumn('posts', 'prompt_text'))) {
            await queryRunner.query('ALTER TABLE `posts` ADD COLUMN `prompt_text` VARCHAR(255) NULL DEFAULT NULL');
        }
    }
    async down(queryRunner) {
        if (await queryRunner.hasColumn('posts', 'prompt_text')) {
            await queryRunner.query('ALTER TABLE `posts` DROP COLUMN `prompt_text`');
        }
        if (await queryRunner.hasColumn('posts', 'prompt_day')) {
            await queryRunner.query('ALTER TABLE `posts` DROP INDEX `IDX_posts_prompt_day`, DROP COLUMN `prompt_day`');
        }
    }
}
//# sourceMappingURL=1790700000000-DailyPrompts.js.map