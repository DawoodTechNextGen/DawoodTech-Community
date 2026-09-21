import { AuthService } from './auth.service.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import type { AuthenticatedUser } from './jwt.strategy.js';
import { UsersService } from '../users/users.service.js';
export declare class AuthController {
    private readonly auth;
    private readonly users;
    constructor(auth: AuthService, users: UsersService);
    signup(dto: SignupDto): Promise<{
        user: import("../users/user.mapper.js").PublicUser;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: import("../users/user.mapper.js").PublicUser;
    }>;
    refresh(dto: RefreshDto): Promise<import("./auth.service.js").TokenPair>;
    logout(dto: RefreshDto): Promise<{
        success: boolean;
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        success: boolean;
    }>;
    resendVerification(dto: ResendVerificationDto): Promise<{
        success: boolean;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        success: boolean;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        success: boolean;
    }>;
    me(authUser: AuthenticatedUser): Promise<import("../users/user.mapper.js").PublicUser>;
}
