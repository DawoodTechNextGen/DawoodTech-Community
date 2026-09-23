import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DigestEmailQueue } from '../database/entities/digest-email-queue.entity.js';
import { EmailDigest } from '../database/entities/email-digest.entity.js';
import { Post } from '../database/entities/post.entity.js';
import { PostEmailQueue } from '../database/entities/post-email-queue.entity.js';
import { User } from '../database/entities/user.entity.js';
import { MailModule } from '../mail/mail.module.js';
import { AdminPostEmailsController } from './admin-post-emails.controller.js';
import { DigestEmailsService } from './digest-emails.service.js';
import { PostEmailsService } from './post-emails.service.js';
import { TaskdeskRecipientsService } from './taskdesk-recipients.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostEmailQueue, EmailDigest, DigestEmailQueue, User]),
    MailModule,
  ],
  controllers: [AdminPostEmailsController],
  providers: [PostEmailsService, DigestEmailsService, TaskdeskRecipientsService],
  exports: [PostEmailsService, DigestEmailsService, TaskdeskRecipientsService],
})
export class PostEmailsModule {}
