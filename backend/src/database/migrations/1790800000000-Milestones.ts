import type { MigrationInterface, QueryRunner } from 'typeorm';

/** milestones (celebrated events) + posts.milestone (the post celebrating one). */
export class Milestones1790800000000 implements MigrationInterface {
  name = 'Milestones1790800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Brand-new database: synchronize (dev) builds everything from the entities.
    if (!(await queryRunner.hasTable('posts'))) return;

    if (!(await queryRunner.hasColumn('posts', 'milestone'))) {
      await queryRunner.query(
        "ALTER TABLE `posts` ADD COLUMN `milestone` ENUM('joined','internship_completed') NULL DEFAULT NULL",
      );
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

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('milestones')) {
      await queryRunner.query('DROP TABLE `milestones`');
    }
    if (await queryRunner.hasColumn('posts', 'milestone')) {
      await queryRunner.query('ALTER TABLE `posts` DROP COLUMN `milestone`');
    }
  }
}
