export class FollowEmails1790300000000 {
    name = 'FollowEmails1790300000000';
    async up(queryRunner) {
        if (!(await queryRunner.hasTable('activity_email_queue')))
            return;
        await queryRunner.query("ALTER TABLE `activity_email_queue` MODIFY `type` ENUM('like', 'comment', 'reply', 'thread_comment', 'follow') NOT NULL");
        await queryRunner.query('ALTER TABLE `activity_email_queue` MODIFY `post_id` BIGINT NULL DEFAULT NULL');
    }
    async down(queryRunner) {
        await queryRunner.query("DELETE FROM `activity_email_queue` WHERE `type` = 'follow'");
        await queryRunner.query('ALTER TABLE `activity_email_queue` MODIFY `post_id` BIGINT NOT NULL');
        await queryRunner.query("ALTER TABLE `activity_email_queue` MODIFY `type` ENUM('like', 'comment', 'reply', 'thread_comment') NOT NULL");
    }
}
//# sourceMappingURL=1790300000000-FollowEmails.js.map