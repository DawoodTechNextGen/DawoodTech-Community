import type { MigrationInterface, QueryRunner } from 'typeorm';

/** likes.reaction: which emoji reaction a like is. Existing likes stay "like". */
export class Reactions1791000000000 implements MigrationInterface {
  name = 'Reactions1791000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Brand-new database: synchronize (dev) builds everything from the entities.
    if (!(await queryRunner.hasTable('likes'))) return;
    if (await queryRunner.hasColumn('likes', 'reaction')) return;
    await queryRunner.query(
      "ALTER TABLE `likes` ADD COLUMN `reaction` ENUM('like','clap','celebrate','insightful','fire') NOT NULL DEFAULT 'like'",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('likes', 'reaction')) {
      await queryRunner.query('ALTER TABLE `likes` DROP COLUMN `reaction`');
    }
  }
}
