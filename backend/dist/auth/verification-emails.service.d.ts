import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DataSource, Repository } from 'typeorm';
import { User } from '../database/entities/user.entity.js';
import { MailService } from '../mail/mail.service.js';
export interface VerificationRunResult {
    sent: number;
    failed: number;
    remaining: number;
}
export declare class VerificationEmailsService {
    private readonly users;
    private readonly dataSource;
    private readonly jwt;
    private readonly config;
    private readonly mail;
    private readonly logger;
    constructor(users: Repository<User>, dataSource: DataSource, jwt: JwtService, config: ConfigService, mail: MailService);
    send(user: User): Promise<void>;
    sendPending(resendOlderThanMs?: number): Promise<VerificationRunResult>;
}
