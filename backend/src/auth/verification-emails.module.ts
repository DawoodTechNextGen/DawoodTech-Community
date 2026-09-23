import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity.js';
import { MailModule } from '../mail/mail.module.js';
import { VerificationEmailsService } from './verification-emails.service.js';

/** Kept apart from AuthModule so the cron CLI can send verification emails
 *  without the rest of auth (and without its startup retry loop). */
@Module({
  imports: [TypeOrmModule.forFeature([User]), JwtModule.register({}), MailModule],
  providers: [VerificationEmailsService],
  exports: [VerificationEmailsService],
})
export class VerificationEmailsModule {}
