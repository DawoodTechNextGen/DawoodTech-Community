import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from '../database/entities/follow.entity.js';
import { RefreshToken } from '../database/entities/refresh-token.entity.js';
import { User } from '../database/entities/user.entity.js';
import { MailModule } from '../mail/mail.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './jwt.strategy.js';
import { VerificationEmailsModule } from './verification-emails.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, Follow]),
    PassportModule,
    JwtModule.register({}),
    UsersModule,
    MailModule,
    VerificationEmailsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
