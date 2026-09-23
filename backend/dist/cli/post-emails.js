var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import configuration from '../config/configuration.js';
import { DatabaseModule } from '../database/database.module.js';
import { Post, PostStatus } from '../database/entities/post.entity.js';
import { MailService } from '../mail/mail.service.js';
import { ActivityEmailsModule } from '../activity-emails/activity-emails.module.js';
import { ActivityEmailsService } from '../activity-emails/activity-emails.service.js';
import { VerificationEmailsModule } from '../auth/verification-emails.module.js';
import { VerificationEmailsService } from '../auth/verification-emails.service.js';
import { DigestEmailsService } from '../post-emails/digest-emails.service.js';
import { PostEmailsModule } from '../post-emails/post-emails.module.js';
import { PostEmailsService } from '../post-emails/post-emails.service.js';
let PostEmailsCliModule = class PostEmailsCliModule {
};
PostEmailsCliModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
            DatabaseModule,
            PostEmailsModule,
            ActivityEmailsModule,
            VerificationEmailsModule,
        ],
    })
], PostEmailsCliModule);
const logger = new Logger('PostEmailsCli');
async function main() {
    const [command = 'worker', ...args] = process.argv.slice(2);
    const app = await NestFactory.createApplicationContext(PostEmailsCliModule, {
        logger: ['log', 'warn', 'error'],
    });
    try {
        const postEmails = app.get(PostEmailsService);
        const digests = app.get(DigestEmailsService);
        switch (command) {
            case 'worker': {
                const activity = await app.get(ActivityEmailsService).processBatch();
                const legacy = await postEmails.processBatch();
                await digests.buildDueDigest();
                const digest = await digests.processBatch();
                const batches = [
                    ['Activity', activity],
                    ['Post', legacy],
                    ['Digest', digest],
                ];
                for (const [label, result] of batches) {
                    if (!result || result.sent + result.failed + result.retrying + result.skipped === 0) {
                        continue;
                    }
                    logger.log(`${label} batch done — sent ${result.sent}, retrying ${result.retrying}, ` +
                        `failed ${result.failed}, skipped ${result.skipped}`);
                }
                return 0;
            }
            case 'recipients': {
                const recipients = await postEmails.eligibleRecipients();
                for (const r of recipients)
                    console.log(`${r.email}\t${r.name ?? ''}`);
                logger.log(`${recipients.length} recipients (mode: ${postEmails.mode})`);
                return 0;
            }
            case 'digest': {
                await digests.buildDueDigest(true);
                return 0;
            }
            case 'test': {
                const to = args[0] ?? app.get(ConfigService).get('postEmails.testRecipient');
                if (!to) {
                    logger.error('Usage: test [email]  (or set POST_EMAIL_TEST_RECIPIENT)');
                    return 1;
                }
                let posts = await digests.pendingPosts();
                if (posts.length === 0) {
                    posts = (await app.get(getRepositoryToken(Post)).find({
                        where: { status: PostStatus.APPROVED },
                        relations: { author: true, media: true },
                        order: { reviewedAt: 'DESC', id: 'DESC' },
                        take: 3,
                    })).reverse();
                }
                if (posts.length === 0) {
                    logger.error('No approved posts to preview.');
                    return 1;
                }
                await postEmails.sendDigest(posts, to, 'Test recipient', new Date());
                logger.log(`Sent a preview digest of ${posts.length} post(s) to ${to}`);
                return 0;
            }
            case 'resend-verification': {
                const { sent, failed, remaining } = await app
                    .get(VerificationEmailsService)
                    .sendPending(60 * 60 * 1000);
                logger.log(`Verification emails — sent ${sent}, failed ${failed}` +
                    (remaining > 0
                        ? `, ${remaining} still waiting (hourly limit): run this again in an hour.`
                        : ', none left.'));
                return 0;
            }
            default:
                logger.error(`Unknown command "${command}" — use worker, recipients, digest, test or resend-verification`);
                return 1;
        }
    }
    finally {
        app.get(MailService).close();
        await app.close();
    }
}
main()
    .then((code) => process.exit(code))
    .catch((err) => {
    logger.error(err instanceof Error ? (err.stack ?? err.message) : String(err));
    process.exit(1);
});
//# sourceMappingURL=post-emails.js.map