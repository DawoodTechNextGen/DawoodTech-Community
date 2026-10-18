export class Reactions1791000000000 {
    name = 'Reactions1791000000000';
    async up(queryRunner) {
        if (!(await queryRunner.hasTable('likes')))
            return;
        if (await queryRunner.hasColumn('likes', 'reaction'))
            return;
        await queryRunner.query("ALTER TABLE `likes` ADD COLUMN `reaction` ENUM('like','clap','celebrate','insightful','fire') NOT NULL DEFAULT 'like'");
    }
    async down(queryRunner) {
        if (await queryRunner.hasColumn('likes', 'reaction')) {
            await queryRunner.query('ALTER TABLE `likes` DROP COLUMN `reaction`');
        }
    }
}
//# sourceMappingURL=1791000000000-Reactions.js.map