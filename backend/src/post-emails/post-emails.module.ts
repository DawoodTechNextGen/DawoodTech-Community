import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '../database/entities/post.entity.js';
import { PostEmailQueue } from '../database/entities/post-email-queue.entity.js';
import { User } from '../database/entities/user.entity.js';
import { MailModule } from '../mail/mail.module.js';
import { AdminPostEmailsController } from './admin-post-emails.controller.js';
import { PostEmailsService } from './post-emails.service.js';
import { TaskdeskRecipientsService } from './taskdesk-recipients.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostEmailQueue, User]),
    MailModule,
  ],
  controllers: [AdminPostEmailsController],
  providers: [PostEmailsService, TaskdeskRecipientsService],
  exports: [PostEmailsService, TaskdeskRecipientsService],
})
export class PostEmailsModule {}
