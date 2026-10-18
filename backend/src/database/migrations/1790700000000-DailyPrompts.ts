import type { MigrationInterface, QueryRunner } from 'typeorm';

/** posts.prompt_day / prompt_text: a post written as an answer to the day's question. */
export class DailyPrompts1790700000000 implements MigrationInterface {
  name = 'DailyPrompts1790700000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Brand-new database: synchronize (dev) builds everything from the entities.
    if (!(await queryRunner.hasTable('posts'))) return;

    if (!(await queryRunner.hasColumn('posts', 'prompt_day'))) {
      await queryRunner.query(
        'ALTER TABLE `posts` ADD COLUMN `prompt_day` CHAR(10) NULL DEFAULT NULL, ADD INDEX `IDX_posts_prompt_day` (`prompt_day`)',
      );
    }
    if (!(await queryRunner.hasColumn('posts', 'prompt_text'))) {
      await queryRunner.query(
        'ALTER TABLE `posts` ADD COLUMN `prompt_text` VARCHAR(255) NULL DEFAULT NULL',
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('posts', 'prompt_text')) {
      await queryRunner.query('ALTER TABLE `posts` DROP COLUMN `prompt_text`');
    }
    if (await queryRunner.hasColumn('posts', 'prompt_day')) {
      await queryRunner.query(
        'ALTER TABLE `posts` DROP INDEX `IDX_posts_prompt_day`, DROP COLUMN `prompt_day`',
      );
    }
  }
}
