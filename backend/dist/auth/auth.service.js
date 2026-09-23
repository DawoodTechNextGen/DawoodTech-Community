var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
import { ConflictException, ForbiddenException, Injectable, Logger, UnauthorizedException, } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { DataSource, IsNull, LessThan, MoreThan, Repository } from 'typeorm';
import { MailService } from '../mail/mail.service.js';
import { errorMessage, hourlyAllowance, withAdvisoryLock, } from '../post-emails/email-worker-utils.js';
import { resetPasswordTemplate, verifyEmailTemplate } from '../mail/templates.js';
import { RefreshToken } from '../database/entities/refresh-token.entity.js';
import { User, UserRole, UserStatus } from '../database/entities/user.entity.js';
const BCRYPT_ROUNDS = 12;
const ACTION_TOKEN_EXPIRES_IN = '1h';
const VERIFICATION_RETRY_EVERY_MS = 10 * 60 * 1000;
const VERIFICATION_MAX_ATTEMPTS = 3;
const VERIFICATION_RETRY_LOCK = 'dawoodtech_community_verification_retry';
let AuthService = AuthService_1 = class AuthService {
    users;
    refreshTokens;
    jwt;
    config;
    mail;
    dataSource;
    logger = new Logger(AuthService_1.name);
    retryTimer = null;
    constructor(users, refreshTokens, jwt, config, mail, dataSource) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.jwt = jwt;
        this.config = config;
        this.mail = mail;
        this.dataSource = dataSource;
    }
    onApplicationBootstrap() {
        void this.sendPendingVerificationEmails();
        this.retryTimer = setInterval(() => void this.sendPendingVerificationEmails(), VERIFICATION_RETRY_EVERY_MS);
        this.retryTimer.unref();
    }
    onModuleDestroy() {
        if (this.retryTimer)
            clearInterval(this.retryTimer);
    }
    async sendPendingVerificationEmails() {
        try {
            const sent = await withAdvisoryLock(this.dataSource, VERIFICATION_RETRY_LOCK, async () => {
                const allowance = await hourlyAllowance(this.dataSource, this.config.get('postEmails.hourlyLimit') ?? 20);
                if (allowance === 0)
                    return 0;
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
                    }
                    catch (err) {
                        this.logger.warn(`Retrying the verification email to ${user.email} failed: ${errorMessage(err)}`);
                    }
                }
                if (count > 0)
                    this.logger.log(`Sent ${count} pending verification email(s).`);
                return count;
            });
            return sent ?? 0;
        }
        catch (err) {
            this.logger.error(`Couldn't send pending verification emails: ${errorMessage(err)}`);
            return 0;
        }
    }
    async signup(dto) {
        const existing = await this.users.findOne({
            where: [{ email: dto.email }, { username: dto.username }],
        });
        if (existing) {
            throw new ConflictException('Email or username already in use');
        }
        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        const user = await this.users.save(this.users.create({
            email: dto.email,
            username: dto.username,
            fullName: dto.fullName,
            passwordHash,
            role: UserRole.INTERN,
        }));
        try {
            await this.sendVerificationEmail(user);
        }
        catch (err) {
            this.logger.error(`Could not send the verification email to ${user.email}: ${err instanceof Error ? err.message : String(err)}`);
        }
        return user;
    }
    async login(dto) {
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
    async sendVerificationEmail(user) {
        const token = await this.signActionToken(user.id, 'verify-email');
        const link = `${this.config.get('frontendUrl')}/verify-email?token=${token}`;
        const { subject, html } = verifyEmailTemplate(user.fullName, link);
        try {
            await this.mail.send({ to: user.email, subject, html });
        }
        catch (err) {
            await this.users.increment({ id: user.id }, 'verificationEmailAttempts', 1);
            throw err;
        }
        await this.users.update({ id: user.id }, { verificationEmailSentAt: new Date() });
    }
    async resendVerification(email) {
        const user = await this.users.findOneBy({ email });
        if (user && !user.isEmailVerified) {
            await this.sendVerificationEmail(user);
        }
    }
    async verifyEmail(token) {
        const payload = await this.verifyActionToken(token, 'verify-email');
        const user = await this.users.findOneByOrFail({ id: payload.sub });
        if (!user.isEmailVerified) {
            user.isEmailVerified = true;
            await this.users.save(user);
        }
    }
    async forgotPassword(email) {
        const user = await this.users.findOneBy({ email });
        if (!user)
            return;
        const token = await this.signActionToken(user.id, 'reset-password');
        const link = `${this.config.get('frontendUrl')}/reset-password?token=${token}`;
        const { subject, html } = resetPasswordTemplate(user.fullName, link);
        await this.mail.send({ to: user.email, subject, html });
    }
    async resetPassword(token, newPassword) {
        const payload = await this.verifyActionToken(token, 'reset-password');
        const user = await this.users.findOneByOrFail({ id: payload.sub });
        user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
        await this.users.save(user);
        await this.refreshTokens.update({ userId: user.id, revoked: false }, { revoked: true });
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(refreshToken, {
                secret: this.config.get('jwt.refreshSecret'),
            });
        }
        catch {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
        const candidates = await this.refreshTokens.find({
            where: { userId: payload.sub, revoked: false, expiresAt: MoreThan(new Date()) },
        });
        let matched;
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
    async logout(refreshToken) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(refreshToken, {
                secret: this.config.get('jwt.refreshSecret'),
            });
        }
        catch {
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
    async signActionToken(userId, purpose) {
        const payload = { sub: userId, purpose };
        return this.jwt.signAsync(payload, {
            secret: this.config.get('jwt.emailTokenSecret'),
            expiresIn: ACTION_TOKEN_EXPIRES_IN,
        });
    }
    async verifyActionToken(token, expectedPurpose) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(token, {
                secret: this.config.get('jwt.emailTokenSecret'),
            });
        }
        catch {
            throw new UnauthorizedException('This link is invalid or has expired');
        }
        if (payload.purpose !== expectedPurpose) {
            throw new UnauthorizedException('This link is invalid or has expired');
        }
        return payload;
    }
    async issueTokens(user) {
        const payload = { sub: user.id, role: user.role };
        const accessToken = await this.jwt.signAsync(payload, {
            secret: this.config.get('jwt.accessSecret'),
            expiresIn: this.config.get('jwt.accessExpiresIn'),
        });
        const refreshJti = randomUUID();
        const refreshExpiresIn = this.config.get('jwt.refreshExpiresIn');
        const refreshToken = await this.jwt.signAsync({ sub: user.id, jti: refreshJti }, {
            secret: this.config.get('jwt.refreshSecret'),
            expiresIn: refreshExpiresIn,
        });
        const tokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
        await this.refreshTokens.save(this.refreshTokens.create({
            userId: user.id,
            tokenHash,
            expiresAt: addDuration(new Date(), refreshExpiresIn),
            revoked: false,
        }));
        return { accessToken, refreshToken };
    }
};
AuthService = AuthService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(User)),
    __param(1, InjectRepository(RefreshToken)),
    __param(5, InjectDataSource()),
    __metadata("design:paramtypes", [Repository,
        Repository,
        JwtService,
        ConfigService,
        MailService,
        DataSource])
], AuthService);
export { AuthService };
function addDuration(base, duration) {
    const match = /^(\d+)([smhd])$/.exec(duration);
    if (!match)
        return new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
    const value = parseInt(match[1], 10);
    const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]];
    return new Date(base.getTime() + value * unitMs);
}
//# sourceMappingURL=auth.service.js.map