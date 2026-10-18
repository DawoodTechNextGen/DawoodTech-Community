import { type OnApplicationBootstrap, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service.js';
import { Follow } from '../database/entities/follow.entity.js';
import { RefreshToken } from '../database/entities/refresh-token.entity.js';
import { User } from '../database/entities/user.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { VerificationEmailsService } from './verification-emails.service.js';
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService implements OnApplicationBootstrap, OnModuleDestroy {
    private readonly users;
    private readonly refreshTokens;
    private readonly follows;
    private readonly jwt;
    private readonly config;
    private readonly mail;
    private readonly verificationEmails;
    private readonly events;
    private readonly logger;
    private retryTimer;
    constructor(users: Repository<User>, refreshTokens: Repository<RefreshToken>, follows: Repository<Follow>, jwt: JwtService, config: ConfigService, mail: MailService, verificationEmails: VerificationEmailsService, events: EventEmitter2);
    onApplicationBootstrap(): void;
    onModuleDestroy(): void;
    signup(dto: SignupDto): Promise<User>;
    login(dto: LoginDto): Promise<{
        user: User;
        tokens: TokenPair;
    }>;
    sendVerificationEmail(user: User): Promise<void>;
    resendVerification(email: string): Promise<void>;
    verifyEmail(token: string): Promise<void>;
    private followStaff;
    forgotPassword(email: string): Promise<void>;
    resetPassword(token: string, newPassword: string): Promise<void>;
    refresh(refreshToken: string): Promise<TokenPair>;
    logout(refreshToken: string): Promise<void>;
    private findWithPasswordHash;
    private findActiveRefreshToken;
    private signActionToken;
    private verifyActionToken;
    private issueTokens;
}
