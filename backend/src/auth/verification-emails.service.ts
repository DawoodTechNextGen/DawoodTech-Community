import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { User, UserStatus } from '../database/entities/user.entity.js';
import { MailService } from '../mail/mail.service.js';
import { verifyEmailTemplate } from '../mail/templates.js';
import { errorMessage, hourlyAllowance, withAdvisoryLock } from '../mail/mail-utils.js';

const TOKEN_EXPIRES_IN = '1h';
const MAX_ATTEMPTS = 3;
const LOCK = 'dawoodtech_community_verification_emails';

export interface VerificationRunResult {
  sent: number;
  failed: number;
  /** Still waiting after this run (hourly limit reached) — run again later. */
  remaining: number;
}

/**
 * Verification emails: sending one, and catching up on members who never got
 * one. Used by the app (signup, resend, retry on startup) and by the cron CLI
 * (`resend-verification`).
 */
@Injectable()
export class VerificationEmailsService {
  private readonly logger = new Logger(VerificationEmailsService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  /** Sends a fresh verification link and records whether it went out. */
  async send(user: User): Promise<void> {
    const token = await this.jwt.signAsync(
      { sub: user.id, purpose: 'verify-email' },
      {
        secret: this.config.get<string>('jwt.emailTokenSecret'),
        expiresIn: TOKEN_EXPIRES_IN as JwtSignOptions['expiresIn'],
      },
    );
    const link = `${this.config.get<string>('frontendUrl')}/verify-email?token=${token}`;
    const { subject, html } = verifyEmailTemplate(user.fullName, link);
    try {
      await this.mail.send({ to: user.email, subject, html });
    } catch (err) {
      await this.users.increment({ id: user.id }, 'verificationEmailAttempts', 1);
      throw err;
    }
    await this.users.update(
      { id: user.id },
      { verificationEmailSentAt: new Date(), verificationEmailAttempts: 0 },
    );
  }

  /**
   * Emails unverified, active members, within EMAIL_HOURLY_LIMIT, skipping
   * addresses that already failed 3 times. By default only those who never
   * got a verification email; with `resendOlderThanMs`, also those whose last
   * one is older than that (their link has expired). Never throws.
   */
  async sendPending(resendOlderThanMs?: number): Promise<VerificationRunResult> {
    const empty: VerificationRunResult = { sent: 0, failed: 0, remaining: 0 };
    try {
      const result = await withAdvisoryLock(this.dataSource, LOCK, async () => {
        const query = this.users
          .createQueryBuilder('u')
          .where('u.isEmailVerified = :no', { no: false })
          .andWhere('u.status = :active', { active: UserStatus.ACTIVE })
          .andWhere('u.verificationEmailAttempts < :max', { max: MAX_ATTEMPTS })
          .andWhere(
            new Brackets((qb) => {
              qb.where('u.verificationEmailSentAt IS NULL');
              if (resendOlderThanMs !== undefined) {
                qb.orWhere('u.verificationEmailSentAt < :before', {
                  before: new Date(Date.now() - resendOlderThanMs),
                });
              }
            }),
          )
          .orderBy('u.id', 'ASC');

        const total = await query.getCount();
        const allowance = await hourlyAllowance(
          this.dataSource,
          this.config.get<number>('emailHourlyLimit') ?? 20,
        );
        const batch = allowance > 0 ? await query.take(allowance).getMany() : [];

        let sent = 0;
        let failed = 0;
        for (const user of batch) {
          try {
            await this.send(user);
            sent++;
          } catch (err) {
            failed++;
            this.logger.warn(`Verification email to ${user.email} failed: ${errorMessage(err)}`);
          }
        }
        if (sent > 0) this.logger.log(`Sent ${sent} verification email(s).`);
        return { sent, failed, remaining: total - sent - failed };
      });
      return result ?? empty;
    } catch (err) {
      this.logger.error(`Couldn't send pending verification emails: ${errorMessage(err)}`);
      return empty;
    }
  }
}
