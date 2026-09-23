import type { MigrationInterface, QueryRunner } from 'typeorm';

/** activity_email_queue: allow "new follower" emails, which have no post. */
export class FollowEmails1790300000000 implements MigrationInterface {
  name = 'FollowEmails1790300000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Brand-new database: synchronize (dev) builds the table from the entity.
    if (!(await queryRunner.hasTable('activity_email_queue'))) return;

    await queryRunner.query(
      "ALTER TABLE `activity_email_queue` MODIFY `type` ENUM('like', 'comment', 'reply', 'thread_comment', 'follow') NOT NULL",
    );
    await queryRunner.query(
      'ALTER TABLE `activity_email_queue` MODIFY `post_id` BIGINT NULL DEFAULT NULL',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DELETE FROM `activity_email_queue` WHERE `type` = 'follow'");
    await queryRunner.query('ALTER TABLE `activity_email_queue` MODIFY `post_id` BIGINT NOT NULL');
    await queryRunner.query(
      "ALTER TABLE `activity_email_queue` MODIFY `type` ENUM('like', 'comment', 'reply', 'thread_comment') NOT NULL",
    );
  }
}
