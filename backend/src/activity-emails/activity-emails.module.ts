import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityEmailQueue } from '../database/entities/activity-email-queue.entity.js';
import { Comment } from '../database/entities/comment.entity.js';
import { Like } from '../database/entities/like.entity.js';
import { Post } from '../database/entities/post.entity.js';
import { User } from '../database/entities/user.entity.js';
import { MailModule } from '../mail/mail.module.js';
import { ActivityEmailsService } from './activity-emails.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityEmailQueue, Post, Comment, Like, User]),
    MailModule,
  ],
  providers: [ActivityEmailsService],
  exports: [ActivityEmailsService],
})
export class ActivityEmailsModule {}
