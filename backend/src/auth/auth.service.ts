import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { DataSource, IsNull, LessThan, MoreThan, Repository } from 'typeorm';
import { MailService } from '../mail/mail.service.js';
import {
  errorMessage,
  hourlyAllowance,
  withAdvisoryLock,
} from '../post-emails/email-worker-utils.js';
import { resetPasswordTemplate, verifyEmailTemplate } from '../mail/templates.js';
import { RefreshToken } from '../database/entities/refresh-token.entity.js';
import { User, UserRole, UserStatus } from '../database/entities/user.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import type { JwtPayload } from './jwt.strategy.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

type ActionPurpose = 'verify-email' | 'reset-password';

interface ActionTokenPayload {
  sub: number;
  purpose: ActionPurpose;
}

const BCRYPT_ROUNDS = 12;
const ACTION_TOKEN_EXPIRES_IN = '1h';
const VERIFICATION_RETRY_EVERY_MS = 10 * 60 * 1000;
const VERIFICATION_MAX_ATTEMPTS = 3;
const VERIFICATION_RETRY_LOCK = 'dawoodtech_community_verification_retry';

@Injectable()
export class AuthService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(AuthService.name);
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  // Verification emails that never went out (mail server busy or rate-limited
  // at signup) are retried as soon as the app starts, then every 10 minutes.
  onApplicationBootstrap(): void {
    void this.sendPendingVerificationEmails();
    this.retryTimer = setInterval(
      () => void this.sendPendingVerificationEmails(),
      VERIFICATION_RETRY_EVERY_MS,
    );
    this.retryTimer.unref();
  }

  onModuleDestroy(): void {
    if (this.retryTimer) clearInterval(this.retryTimer);
  }

  /** Sends verification emails to unverified members who never received one,
   *  within EMAIL_HOURLY_LIMIT. Never throws. */
  async sendPendingVerificationEmails(): Promise<number> {
    try {
      const sent = await withAdvisoryLock(this.dataSource, VERIFICATION_RETRY_LOCK, async () => {
        const allowance = await hourlyAllowance(
          this.dataSource,
          this.config.get<number>('postEmails.hourlyLimit') ?? 20,
        );
        if (allowance === 0) return 0;

        const pending = await this.users.find({
          where: {
            isEmailVerified: false,
            status: UserStatus.ACTIVE,
            verificationEmailSentAt: IsNull(),
            verificationEmailAttempts: LessThan(VERIFICATION_MAX_ATTEMPTS),
          },
          order: { id: 'ASC' },
          take: allowance,
        });

        let count = 0;
        for (const user of pending) {
          try {
            await this.sendVerificationEmail(user);
            count++;
          } catch (err) {
            this.logger.warn(
              `Retrying the verification email to ${user.email} failed: ${errorMessage(err)}`,
            );
          }
        }
        if (count > 0) this.logger.log(`Sent ${count} pending verification email(s).`);
        return count;
      });
      return sent ?? 0;
    } catch (err) {
      this.logger.error(`Couldn't send pending verification emails: ${errorMessage(err)}`);
      return 0;
    }
  }

  async signup(dto: SignupDto): Promise<User> {
    const existing = await this.users.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });
    if (existing) {
      throw new ConflictException('Email or username already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.users.save(
      this.users.create({
        email: dto.email,
        username: dto.username,
        fullName: dto.fullName,
        passwordHash,
        role: UserRole.INTERN,
      }),
    );

    // A busy or rate-limited mail server must not fail the signup: the account
    // is saved, the app retries the email on its own (see
    // sendPendingVerificationEmails), and the login page offers a resend.
    try {
      await this.sendVerificationEmail(user);
    } catch (err) {
      this.logger.error(
        `Could not send the verification email to ${user.email}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    return user;
  }

  async login(dto: LoginDto): Promise<{ user: User; tokens: TokenPair }> {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: dto.email })
      .getOne();

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException('EMAIL_NOT_VERIFIED');
    }

    if (user.status === UserStatus.DISABLED) {
      throw new ForbiddenException('ACCOUNT_DISABLED');
    }

    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  /** Sends a fresh verification link and records whether it went out. */
  async sendVerificationEmail(user: User): Promise<void> {
    const token = await this.signActionToken(user.id, 'verify-email');
    const link = `${this.config.get<string>('frontendUrl')}/verify-email?token=${token}`;
    const { subject, html } = verifyEmailTemplate(user.fullName, link);
    try {
      await this.mail.send({ to: user.email, subject, html });
    } catch (err) {
      await this.users.increment({ id: user.id }, 'verificationEmailAttempts', 1);
      throw err;
    }
    await this.users.update({ id: user.id }, { verificationEmailSentAt: new Date() });
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.users.findOneBy({ email });
    if (user && !user.isEmailVerified) {
      await this.sendVerificationEmail(user);
    }
  }

  async verifyEmail(token: string): Promise<void> {
    const payload = await this.verifyActionToken(token, 'verify-email');
    const user = await this.users.findOneByOrFail({ id: payload.sub });
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      await this.users.save(user);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.users.findOneBy({ email });
    if (!user) return;

    const token = await this.signActionToken(user.id, 'reset-password');
    const link = `${this.config.get<string>('frontendUrl')}/reset-password?token=${token}`;
    const { subject, html } = resetPasswordTemplate(user.fullName, link);
    await this.mail.send({ to: user.email, subject, html });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const payload = await this.verifyActionToken(token, 'reset-password');
    const user = await this.users.findOneByOrFail({ id: payload.sub });

    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.users.save(user);

    // Force re-login everywhere after a password reset.
    await this.refreshTokens.update({ userId: user.id, revoked: false }, { revoked: true });
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: { sub: number };
    try {
      payload = await this.jwt.verifyAsync<{ sub: number }>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const candidates = await this.refreshTokens.find({
      where: { userId: payload.sub, revoked: false, expiresAt: MoreThan(new Date()) },
    });

    let matched: RefreshToken | undefined;
    for (const candidate of candidates) {
      if (await bcrypt.compare(refreshToken, candidate.tokenHash)) {
        matched = candidate;
        break;
      }
    }
    if (!matched) {
      throw new UnauthorizedException('Refresh token not recognized');
    }

    matched.revoked = true;
    await this.refreshTokens.save(matched);

    const user = await this.users.findOneByOrFail({ id: payload.sub });
    if (user.status === UserStatus.DISABLED) {
      throw new UnauthorizedException('ACCOUNT_DISABLED');
    }
    return this.issueTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    let payload: { sub: number };
    try {
      payload = await this.jwt.verifyAsync<{ sub: number }>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      return;
    }

    const candidates = await this.refreshTokens.find({
      where: { userId: payload.sub, revoked: false },
    });
    for (const candidate of candidates) {
      if (await bcrypt.compare(refreshToken, candidate.tokenHash)) {
        candidate.revoked = true;
        await this.refreshTokens.save(candidate);
        break;
      }
    }
  }

  private async signActionToken(userId: number, purpose: ActionPurpose): Promise<string> {
    const payload: ActionTokenPayload = { sub: userId, purpose };
    return this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.emailTokenSecret'),
      expiresIn: ACTION_TOKEN_EXPIRES_IN as JwtSignOptions['expiresIn'],
    });
  }

  private async verifyActionToken(
    token: string,
    expectedPurpose: ActionPurpose,
  ): Promise<ActionTokenPayload> {
    let payload: ActionTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<ActionTokenPayload>(token, {
        secret: this.config.get<string>('jwt.emailTokenSecret'),
      });
    } catch {
      throw new UnauthorizedException('This link is invalid or has expired');
    }
    if (payload.purpose !== expectedPurpose) {
      throw new UnauthorizedException('This link is invalid or has expired');
    }
    return payload;
  }

  private async issueTokens(user: User): Promise<TokenPair> {
    const payload: JwtPayload = { sub: user.id, role: user.role };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<string>('jwt.accessExpiresIn') as JwtSignOptions['expiresIn'],
    });

    const refreshJti = randomUUID();
    const refreshExpiresIn = this.config.get<string>('jwt.refreshExpiresIn')!;
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, jti: refreshJti },
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: refreshExpiresIn as JwtSignOptions['expiresIn'],
      },
    );

    const tokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.refreshTokens.save(
      this.refreshTokens.create({
        userId: user.id,
        tokenHash,
        expiresAt: addDuration(new Date(), refreshExpiresIn),
        revoked: false,
      }),
    );

    return { accessToken, refreshToken };
  }
}

function addDuration(base: Date, duration: string): Date {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
  const value = parseInt(match[1]!, 10);
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]!]!;
  return new Date(base.getTime() + value * unitMs);
}
