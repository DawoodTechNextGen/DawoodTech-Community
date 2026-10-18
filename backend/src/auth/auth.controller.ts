import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard.js';
import { Public } from '../common/decorators/public.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { toSelfUser } from '../users/user.mapper.js';
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

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

@Controller('auth')
@UseGuards(RateLimitGuard)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Public()
  @Post('signup')
  @RateLimit({ windowMs: HOUR, perIp: 10, perEmail: 3 })
  async signup(@Body() dto: SignupDto) {
    const user = await this.auth.signup(dto);
    return { user: toSelfUser(user) };
  }

  @Public()
  @Post('login')
  @RateLimit({ windowMs: 15 * MINUTE, perIp: 30, perEmail: 10 })
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const { user, tokens } = await this.auth.login(dto);
    return { user: toSelfUser(user), ...tokens };
  }

  @Public()
  @Post('refresh')
  @RateLimit({ windowMs: 15 * MINUTE, perIp: 120 })
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: RefreshDto) {
    await this.auth.logout(dto.refreshToken);
    return { success: true };
  }

  @Public()
  @Post('verify-email')
  @RateLimit({ windowMs: 15 * MINUTE, perIp: 30 })
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.auth.verifyEmail(dto.token);
    return { success: true };
  }

  @Public()
  @Post('resend-verification')
  @RateLimit({ windowMs: HOUR, perIp: 10, perEmail: 3 })
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.auth.resendVerification(dto.email);
    return { success: true };
  }

  @Public()
  @Post('forgot-password')
  @RateLimit({ windowMs: HOUR, perIp: 10, perEmail: 3 })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto.email);
    return { success: true };
  }

  @Public()
  @Post('reset-password')
  @RateLimit({ windowMs: 15 * MINUTE, perIp: 20 })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto.token, dto.newPassword);
    return { success: true };
  }

  @Get('me')
  async me(@CurrentUser() authUser: AuthenticatedUser) {
    const user = await this.users.findByIdOrFail(authUser.id);
    return toSelfUser(user);
  }
}
