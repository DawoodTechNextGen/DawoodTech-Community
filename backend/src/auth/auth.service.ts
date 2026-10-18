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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'node:crypto';
import { LessThan, Like, MoreThan, Repository } from 'typeorm';
import { MailService } from '../mail/mail.service.js';
import { resetPasswordTemplate } from '../mail/templates.js';
import { Follow } from '../database/entities/follow.entity.js';
import { RefreshToken } from '../database/entities/refresh-token.entity.js';
import { User, UserRole, UserStatus } from '../database/entities/user.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import type { JwtPayload } from './jwt.strategy.js';
import { VerificationEmailsService } from './verification-emails.service.js';
import { NotificationEvents } from '../notifications/notification.events.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

type ActionPurpose = 'verify-email' | 'reset-password';

interface ActionTokenPayload {
  sub: number;
  purpose: ActionPurpose;
  /** Reset links only: fingerprint of the password hash they were issued
   *  for, so a link stops working once the password has been changed. */
  pwd?: string;
}

const BCRYPT_ROUNDS = 12;
const ACTION_TOKEN_EXPIRES_IN = '1h';
const VERIFICATION_RETRY_EVERY_MS = 10 * 60 * 1000;

@Injectable()
export class AuthService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(AuthService.name);
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
    @InjectRepository(Follow) private readonly follows: Repository<Follow>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly verificationEmails: VerificationEmailsService,
    private readonly events: EventEmitter2,
  ) {}

  // Verification emails that never went out (mail server busy or rate-limited
  // at signup) are retried as soon as the app starts, then every 10 minutes.
  onApplicationBootstrap(): void {
    void this.verificationEmails.sendPending();
    this.retryTimer = setInterval(
      () => void this.verificationEmails.sendPending(),
      VERIFICATION_RETRY_EVERY_MS,
    );
    this.retryTimer.unref();
  }

  onModuleDestroy(): void {
    if (this.retryTimer) clearInterval(this.retryTimer);
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
    // onApplicationBootstrap), and the login page offers a resend.
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

  sendVerificationEmail(user: User): Promise<void> {
    return this.verificationEmails.send(user);
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
      await this.followStaff(user.id);
      this.events.emit(NotificationEvents.UserVerified, { userId: user.id });
    }
  }

  /** A new member starts out following the admins and supervisors, so their
   *  "For You" feed has something in it from day one. Silent: no follow
   *  notifications for staff about every new signup. */
  private async followStaff(userId: number): Promise<void> {
    const staff = await this.users.find({
      select: { id: true },
      where: [
        { role: UserRole.ADMIN, status: UserStatus.ACTIVE },
        { role: UserRole.SUPERVISOR, status: UserStatus.ACTIVE },
      ],
    });
    const rows = staff
      .filter((s) => String(s.id) !== String(userId))
      .map((s) => ({ followerId: userId, followingId: s.id }));
    if (rows.length === 0) return;
    await this.follows.createQueryBuilder().insert().into(Follow).values(rows).orIgnore().execute();
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.findWithPasswordHash(email);
    if (!user) return;

    const token = await this.signActionToken(user.id, 'reset-password', {
      pwd: passwordFingerprint(user.passwordHash),
    });
    const link = `${this.config.get<string>('frontendUrl')}/reset-password?token=${token}`;
    const { subject, html } = resetPasswordTemplate(user.fullName, link);
    // A mail failure must look the same as an unknown address: an error here
    // would tell anyone which emails have accounts.
    try {
      await this.mail.send({ to: user.email, subject, html });
    } catch (err) {
      this.logger.error(
        `Could not send the password reset email to ${user.email}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const payload = await this.verifyActionToken(token, 'reset-password');
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id: payload.sub })
      .getOne();
    // Single use: the first reset changes the hash, which retires the link.
    if (!user || payload.pwd !== passwordFingerprint(user.passwordHash)) {
      throw new UnauthorizedException('This link is invalid or has expired');
    }

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

    const matched = await this.findActiveRefreshToken(payload.sub, refreshToken);
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

    const matched = await this.findActiveRefreshToken(payload.sub, refreshToken);
    if (matched) {
      matched.revoked = true;
      await this.refreshTokens.save(matched);
    }
  }

  private findWithPasswordHash(email: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  /** Refresh tokens are stored as a SHA-256 of the whole token: a single
   *  indexed lookup, and unlike bcrypt (which reads only the first 72 bytes —
   *  little more than the JWT header) it covers every byte. */
  private async findActiveRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<RefreshToken | null> {
    const active = { userId, revoked: false, expiresAt: MoreThan(new Date()) };
    const direct = await this.refreshTokens.findOneBy({
      ...active,
      tokenHash: sha256(refreshToken),
    });
    if (direct) return direct;

    // Tokens issued before the switch are bcrypt hashes ("$2..."); they keep
    // working until they expire, so nobody is logged out by the change.
    const legacy = await this.refreshTokens.findBy({
      ...active,
      tokenHash: Like('$2%'),
    });
    for (const candidate of legacy) {
      if (await bcrypt.compare(refreshToken, candidate.tokenHash)) return candidate;
    }
    return null;
  }

  private async signActionToken(
    userId: number,
    purpose: ActionPurpose,
    extra: Pick<ActionTokenPayload, 'pwd'> = {},
  ): Promise<string> {
    const payload: ActionTokenPayload = { sub: userId, purpose, ...extra };
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

    // Old rows are only dead weight: drop this user's revoked and expired ones.
    await this.refreshTokens.delete({ userId: user.id, revoked: true });
    await this.refreshTokens.delete({
      userId: user.id,
      expiresAt: LessThan(new Date()),
    });
    await this.refreshTokens.save(
      this.refreshTokens.create({
        userId: user.id,
        tokenHash: sha256(refreshToken),
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

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function passwordFingerprint(passwordHash: string): string {
  return sha256(passwordHash).slice(0, 16);
}
