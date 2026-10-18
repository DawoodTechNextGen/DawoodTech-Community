/**
 * Email CLI — run from backend/ so .env is picked up.
 *
 *   node dist/cli/post-emails.js resend-verification
 *       email a fresh verification link to every member who hasn't verified
 *       (and hasn't had one in the last hour), within EMAIL_HOURLY_LIMIT —
 *       run again for the rest. Needs JWT_EMAIL_TOKEN_SECRET and FRONTEND_URL.
 *
 * Post, like, comment and follow emails were removed — those now arrive as
 * in-app notifications. `worker` (what the old cron job ran) does nothing, so
 * that cron job can be deleted.
 */
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import configuration from '../config/configuration.js';
import { DatabaseModule } from '../database/database.module.js';
import { MailService } from '../mail/mail.service.js';
import { VerificationEmailsModule } from '../auth/verification-emails.module.js';
import { VerificationEmailsService } from '../auth/verification-emails.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    DatabaseModule,
    VerificationEmailsModule,
  ],
})
class EmailsCliModule {}

const logger = new Logger('EmailsCli');

async function main(): Promise<number> {
  const [command = 'worker'] = process.argv.slice(2);

  if (command === 'worker') {
    logger.log(
      'Community emails are turned off (notifications are in-app now) — this cron job can be removed.',
    );
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
    logger.log(
      `Verification emails — sent ${sent}, failed ${failed}` +
        (remaining > 0
          ? `, ${remaining} still waiting (hourly limit): run this again in an hour.`
          : ', none left.'),
    );
    return 0;
  } finally {
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
