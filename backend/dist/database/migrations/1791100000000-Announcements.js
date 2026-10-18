export class Announcements1791100000000 {
    name = 'Announcements1791100000000';
    async up(queryRunner) {
        if (!(await queryRunner.hasTable('posts')))
            return;
        if (!(await queryRunner.hasColumn('posts', 'pinned_at'))) {
            await queryRunner.query('ALTER TABLE `posts` ADD COLUMN `pinned_at` DATETIME NULL DEFAULT NULL, ADD INDEX `IDX_posts_pinned_at` (`pinned_at`)');
        }
        await queryRunner.query("ALTER TABLE `notifications` MODIFY `type` ENUM('comment','reply','follow','like','post_approved','post_rejected','mention','announcement') NOT NULL");
    }
    async down(queryRunner) {
        await queryRunner.query("DELETE FROM `notifications` WHERE `type` = 'announcement'");
        await queryRunner.query("ALTER TABLE `notifications` MODIFY `type` ENUM('comment','reply','follow','like','post_approved','post_rejected','mention') NOT NULL");
        if (await queryRunner.hasColumn('posts', 'pinned_at')) {
            await queryRunner.query('ALTER TABLE `posts` DROP INDEX `IDX_posts_pinned_at`, DROP COLUMN `pinned_at`');
        }
    }
}
//# sourceMappingURL=1791100000000-Announcements.js.map