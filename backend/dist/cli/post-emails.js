var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import configuration from '../config/configuration.js';
import { DatabaseModule } from '../database/database.module.js';
import { MailService } from '../mail/mail.service.js';
import { VerificationEmailsModule } from '../auth/verification-emails.module.js';
import { VerificationEmailsService } from '../auth/verification-emails.service.js';
let EmailsCliModule = class EmailsCliModule {
};
EmailsCliModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
            DatabaseModule,
            VerificationEmailsModule,
        ],
    })
], EmailsCliModule);
const logger = new Logger('EmailsCli');
async function main() {
    const [command = 'worker'] = process.argv.slice(2);
    if (command === 'worker') {
        logger.log('Community emails are turned off (notifications are in-app now) — this cron job can be removed.');
        return 0;
    }
    if (command !== 'resend-verification') {
        logger.error(`Unknown command "${command}" — use resend-verification`);
        return 1;
    }
    const app = await NestFactory.createApplicationContext(EmailsCliModule, {
        logger: ['log', 'warn', 'error'],
    });
    try {
        const { sent, failed, remaining } = await app
            .get(VerificationEmailsService)
            .sendPending(60 * 60 * 1000);
        logger.log(`Verification emails — sent ${sent}, failed ${failed}` +
            (remaining > 0
                ? `, ${remaining} still waiting (hourly limit): run this again in an hour.`
                : ', none left.'));
        return 0;
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