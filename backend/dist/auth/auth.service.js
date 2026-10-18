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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'node:crypto';
import { LessThan, Like, MoreThan, Repository } from 'typeorm';
import { MailService } from '../mail/mail.service.js';
import { resetPasswordTemplate } from '../mail/templates.js';
import { Follow } from '../database/entities/follow.entity.js';
import { RefreshToken } from '../database/entities/refresh-token.entity.js';
import { User, UserRole, UserStatus } from '../database/entities/user.entity.js';
import { VerificationEmailsService } from './verification-emails.service.js';
import { NotificationEvents } from '../notifications/notification.events.js';
const BCRYPT_ROUNDS = 12;
const ACTION_TOKEN_EXPIRES_IN = '1h';
const VERIFICATION_RETRY_EVERY_MS = 10 * 60 * 1000;
let AuthService = AuthService_1 = class AuthService {
    users;
    refreshTokens;
    follows;
    jwt;
    config;
    mail;
    verificationEmails;
    events;
    logger = new Logger(AuthService_1.name);
    retryTimer = null;
    constructor(users, refreshTokens, follows, jwt, config, mail, verificationEmails, events) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.follows = follows;
        this.jwt = jwt;
        this.config = config;
        this.mail = mail;
        this.verificationEmails = verificationEmails;
        this.events = events;
    }
    onApplicationBootstrap() {
        void this.verificationEmails.sendPending();
        this.retryTimer = setInterval(() => void this.verificationEmails.sendPending(), VERIFICATION_RETRY_EVERY_MS);
        this.retryTimer.unref();
    }
    onModuleDestroy() {
        if (this.retryTimer)
            clearInterval(this.retryTimer);
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
    sendVerificationEmail(user) {
        return this.verificationEmails.send(user);
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
            await this.followStaff(user.id);
            this.events.emit(NotificationEvents.UserVerified, { userId: user.id });
        }
    }
    async followStaff(userId) {
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
        if (rows.length === 0)
            return;
        await this.follows.createQueryBuilder().insert().into(Follow).values(rows).orIgnore().execute();
    }
    async forgotPassword(email) {
        const user = await this.findWithPasswordHash(email);
        if (!user)
            return;
        const token = await this.signActionToken(user.id, 'reset-password', {
            pwd: passwordFingerprint(user.passwordHash),
        });
        const link = `${this.config.get('frontendUrl')}/reset-password?token=${token}`;
        const { subject, html } = resetPasswordTemplate(user.fullName, link);
        try {
            await this.mail.send({ to: user.email, subject, html });
        }
        catch (err) {
            this.logger.error(`Could not send the password reset email to ${user.email}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    async resetPassword(token, newPassword) {
        const payload = await this.verifyActionToken(token, 'reset-password');
        const user = await this.users
            .createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .where('user.id = :id', { id: payload.sub })
            .getOne();
        if (!user || payload.pwd !== passwordFingerprint(user.passwordHash)) {
            throw new UnauthorizedException('This link is invalid or has expired');
        }
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
        const matched = await this.findActiveRefreshToken(payload.sub, refreshToken);
        if (matched) {
            matched.revoked = true;
            await this.refreshTokens.save(matched);
        }
    }
    findWithPasswordHash(email) {
        return this.users
            .createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .where('user.email = :email', { email })
            .getOne();
    }
    async findActiveRefreshToken(userId, refreshToken) {
        const active = { userId, revoked: false, expiresAt: MoreThan(new Date()) };
        const direct = await this.refreshTokens.findOneBy({
            ...active,
            tokenHash: sha256(refreshToken),
        });
        if (direct)
            return direct;
        const legacy = await this.refreshTokens.findBy({
            ...active,
            tokenHash: Like('$2%'),
        });
        for (const candidate of legacy) {
            if (await bcrypt.compare(refreshToken, candidate.tokenHash))
                return candidate;
        }
        return null;
    }
    async signActionToken(userId, purpose, extra = {}) {
        const payload = { sub: userId, purpose, ...extra };
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
        await this.refreshTokens.delete({ userId: user.id, revoked: true });
        await this.refreshTokens.delete({
            userId: user.id,
            expiresAt: LessThan(new Date()),
        });
        await this.refreshTokens.save(this.refreshTokens.create({
            userId: user.id,
            tokenHash: sha256(refreshToken),
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
    __param(2, InjectRepository(Follow)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        JwtService,
        ConfigService,
        MailService,
        VerificationEmailsService,
        EventEmitter2])
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
function sha256(value) {
    return createHash('sha256').update(value).digest('hex');
}
function passwordFingerprint(passwordHash) {
    return sha256(passwordHash).slice(0, 16);
}
//# sourceMappingURL=auth.service.js.map