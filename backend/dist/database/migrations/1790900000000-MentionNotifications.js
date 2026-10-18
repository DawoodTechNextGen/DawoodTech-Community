export class MentionNotifications1790900000000 {
    name = 'MentionNotifications1790900000000';
    async up(queryRunner) {
        if (!(await queryRunner.hasTable('notifications')))
            return;
        await queryRunner.query("ALTER TABLE `notifications` MODIFY `type` ENUM('comment','reply','follow','like','post_approved','post_rejected','mention') NOT NULL");
    }
    async down(queryRunner) {
        await queryRunner.query("DELETE FROM `notifications` WHERE `type` = 'mention'");
        await queryRunner.query("ALTER TABLE `notifications` MODIFY `type` ENUM('comment','reply','follow','like','post_approved','post_rejected') NOT NULL");
    }
}
//# sourceMappingURL=1790900000000-MentionNotifications.js.map