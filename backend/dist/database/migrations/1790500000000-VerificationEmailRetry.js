export class VerificationEmailRetry1790500000000 {
    name = 'VerificationEmailRetry1790500000000';
    async up(queryRunner) {
        if (!(await queryRunner.hasTable('users')))
            return;
        if (!(await queryRunner.hasColumn('users', 'verification_email_sent_at'))) {
            await queryRunner.query('ALTER TABLE `users` ADD COLUMN `verification_email_sent_at` DATETIME NULL DEFAULT NULL AFTER `is_email_verified`');
        }
        if (!(await queryRunner.hasColumn('users', 'verification_email_attempts'))) {
            await queryRunner.query('ALTER TABLE `users` ADD COLUMN `verification_email_attempts` INT NOT NULL DEFAULT 0 AFTER `verification_email_sent_at`');
        }
    }
    async down(queryRunner) {
        if (await queryRunner.hasColumn('users', 'verification_email_attempts')) {
            await queryRunner.query('ALTER TABLE `users` DROP COLUMN `verification_email_attempts`');
        }
        if (await queryRunner.hasColumn('users', 'verification_email_sent_at')) {
            await queryRunner.query('ALTER TABLE `users` DROP COLUMN `verification_email_sent_at`');
        }
    }
}
//# sourceMappingURL=1790500000000-VerificationEmailRetry.js.map