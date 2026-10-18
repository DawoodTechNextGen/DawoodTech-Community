import type { MigrationInterface, QueryRunner } from 'typeorm';

/** posts.pinned_at (admin-pinned announcements) + the 'announcement' notification type. */
export class Announcements1791100000000 implements MigrationInterface {
  name = 'Announcements1791100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Brand-new database: synchronize (dev) builds everything from the entities.
    if (!(await queryRunner.hasTable('posts'))) return;
    if (!(await queryRunner.hasColumn('posts', 'pinned_at'))) {
      await queryRunner.query(
        'ALTER TABLE `posts` ADD COLUMN `pinned_at` DATETIME NULL DEFAULT NULL, ADD INDEX `IDX_posts_pinned_at` (`pinned_at`)',
      );
    }
    await queryRunner.query(
      "ALTER TABLE `notifications` MODIFY `type` ENUM('comment','reply','follow','like','post_approved','post_rejected','mention','announcement') NOT NULL",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DELETE FROM `notifications` WHERE `type` = 'announcement'");
    await queryRunner.query(
      "ALTER TABLE `notifications` MODIFY `type` ENUM('comment','reply','follow','like','post_approved','post_rejected','mention') NOT NULL",
    );
    if (await queryRunner.hasColumn('posts', 'pinned_at')) {
      await queryRunner.query(
        'ALTER TABLE `posts` DROP INDEX `IDX_posts_pinned_at`, DROP COLUMN `pinned_at`',
      );
    }
  }
}
