import type { MigrationInterface, QueryRunner } from 'typeorm';

/** notifications.type gains 'mention' (@username in a post or comment). */
export class MentionNotifications1790900000000 implements MigrationInterface {
  name = 'MentionNotifications1790900000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Brand-new database: synchronize (dev) builds everything from the entities.
    if (!(await queryRunner.hasTable('notifications'))) return;
    await queryRunner.query(
      "ALTER TABLE `notifications` MODIFY `type` ENUM('comment','reply','follow','like','post_approved','post_rejected','mention') NOT NULL",
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DELETE FROM `notifications` WHERE `type` = 'mention'");
    await queryRunner.query(
      "ALTER TABLE `notifications` MODIFY `type` ENUM('comment','reply','follow','like','post_approved','post_rejected') NOT NULL",
    );
  }
}
