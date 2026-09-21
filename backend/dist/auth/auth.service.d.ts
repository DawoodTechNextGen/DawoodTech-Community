import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service.js';
import { RefreshToken } from '../database/entities/refresh-token.entity.js';
import { User } from '../database/entities/user.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    private readonly users;
    private readonly refreshTokens;
    private readonly jwt;
    private readonly config;
    private readonly mail;
    constructor(users: Repository<User>, refreshTokens: Repository<RefreshToken>, jwt: JwtService, config: ConfigService, mail: MailService);
    signup(dto: SignupDto): Promise<User>;
    login(dto: LoginDto): Promise<{
        user: User;
        tokens: TokenPair;
    }>;
    sendVerificationEmail(user: User): Promise<void>;
    resendVerification(email: string): Promise<void>;
    verifyEmail(token: string): Promise<void>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(token: string, newPassword: string): Promise<void>;
    refresh(refreshToken: string): Promise<TokenPair>;
    logout(refreshToken: string): Promise<void>;
    private signActionToken;
    private verifyActionToken;
    private issueTokens;
}
