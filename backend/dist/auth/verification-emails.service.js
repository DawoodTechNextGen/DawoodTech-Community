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
var VerificationEmailsService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { User, UserStatus } from '../database/entities/user.entity.js';
import { MailService } from '../mail/mail.service.js';
import { verifyEmailTemplate } from '../mail/templates.js';
import { errorMessage, hourlyAllowance, withAdvisoryLock } from '../mail/mail-utils.js';
const TOKEN_EXPIRES_IN = '1h';
const MAX_ATTEMPTS = 3;
const LOCK = 'dawoodtech_community_verification_emails';
let VerificationEmailsService = VerificationEmailsService_1 = class VerificationEmailsService {
    users;
    dataSource;
    jwt;
    config;
    mail;
    logger = new Logger(VerificationEmailsService_1.name);
    constructor(users, dataSource, jwt, config, mail) {
        this.users = users;
        this.dataSource = dataSource;
        this.jwt = jwt;
        this.config = config;
        this.mail = mail;
    }
    async send(user) {
        const token = await this.jwt.signAsync({ sub: user.id, purpose: 'verify-email' }, {
            secret: this.config.get('jwt.emailTokenSecret'),
            expiresIn: TOKEN_EXPIRES_IN,
        });
        const link = `${this.config.get('frontendUrl')}/verify-email?token=${token}`;
        const { subject, html } = verifyEmailTemplate(user.fullName, link);
        try {
            await this.mail.send({ to: user.email, subject, html });
        }
        catch (err) {
            await this.users.increment({ id: user.id }, 'verificationEmailAttempts', 1);
            throw err;
        }
        await this.users.update({ id: user.id }, { verificationEmailSentAt: new Date(), verificationEmailAttempts: 0 });
    }
    async sendPending(resendOlderThanMs) {
        const empty = { sent: 0, failed: 0, remaining: 0 };
        try {
            const result = await withAdvisoryLock(this.dataSource, LOCK, async () => {
                const query = this.users
                    .createQueryBuilder('u')
                    .where('u.isEmailVerified = :no', { no: false })
                    .andWhere('u.status = :active', { active: UserStatus.ACTIVE })
                    .andWhere('u.verificationEmailAttempts < :max', { max: MAX_ATTEMPTS })
                    .andWhere(new Brackets((qb) => {
                    qb.where('u.verificationEmailSentAt IS NULL');
                    if (resendOlderThanMs !== undefined) {
                        qb.orWhere('u.verificationEmailSentAt < :before', {
                            before: new Date(Date.now() - resendOlderThanMs),
                        });
                    }
                }))
                    .orderBy('u.id', 'ASC');
                const total = await query.getCount();
                const allowance = await hourlyAllowance(this.dataSource, this.config.get('emailHourlyLimit') ?? 20);
                const batch = allowance > 0 ? await query.take(allowance).getMany() : [];
                let sent = 0;
                let failed = 0;
                for (const user of batch) {
                    try {
                        await this.send(user);
                        sent++;
                    }
                    catch (err) {
                        failed++;
                        this.logger.warn(`Verification email to ${user.email} failed: ${errorMessage(err)}`);
                    }
                }
                if (sent > 0)
                    this.logger.log(`Sent ${sent} verification email(s).`);
                return { sent, failed, remaining: total - sent - failed };
            });
            return result ?? empty;
        }
        catch (err) {
            this.logger.error(`Couldn't send pending verification emails: ${errorMessage(err)}`);
            return empty;
        }
    }
};
VerificationEmailsService = VerificationEmailsService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(User)),
    __param(1, InjectDataSource()),
    __metadata("design:paramtypes", [Repository,
        DataSource,
        JwtService,
        ConfigService,
        MailService])
], VerificationEmailsService);
export { VerificationEmailsService };
//# sourceMappingURL=verification-emails.service.js.map