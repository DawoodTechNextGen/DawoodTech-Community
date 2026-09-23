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
import { Post } from '../database/entities/post.entity.js';
import { MailService } from '../mail/mail.service.js';
import { ActivityEmailsModule } from '../activity-emails/activity-emails.module.js';
import { ActivityEmailsService } from '../activity-emails/activity-emails.service.js';
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
        switch (command) {
            case 'worker': {
                const batches = [
                    ['New-post', await postEmails.processBatch()],
                    ['Activity', await app.get(ActivityEmailsService).processBatch()],
                ];
                for (const [label, result] of batches) {
                    if (!result)
                        continue;
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
            case 'test': {
                const postId = Number(args[0]);
                const to = args[1] ?? app.get(ConfigService).get('postEmails.testRecipient');
                if (!postId || !to) {
                    logger.error('Usage: test <postId> [email]  (or set POST_EMAIL_TEST_RECIPIENT)');
                    return 1;
                }
                const post = await app
                    .get(getRepositoryToken(Post))
                    .findOne({ where: { id: postId }, relations: { author: true, media: true } });
                if (!post) {
                    logger.error(`Post ${postId} not found`);
                    return 1;
                }
                await postEmails.sendForPost(post, to, 'Test recipient');
                logger.log(`Sent post ${postId}'s notification to ${to}`);
                return 0;
            }
            default:
                logger.error(`Unknown command "${command}" — use worker, recipients or test`);
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