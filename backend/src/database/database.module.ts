import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { Post } from './entities/post.entity.js';
import { PostMedia } from './entities/post-media.entity.js';
import { Comment } from './entities/comment.entity.js';
import { Follow } from './entities/follow.entity.js';
import { Like } from './entities/like.entity.js';
import { Notification } from './entities/notification.entity.js';
import { PostEmailNotifications1790136000000 } from './migrations/1790136000000-PostEmailNotifications.js';
import { ActivityEmails1790200000000 } from './migrations/1790200000000-ActivityEmails.js';
import { FollowEmails1790300000000 } from './migrations/1790300000000-FollowEmails.js';
import { EmailDigests1790400000000 } from './migrations/1790400000000-EmailDigests.js';
import { VerificationEmailRetry1790500000000 } from './migrations/1790500000000-VerificationEmailRetry.js';
import { PushSubscriptions1790600000000 } from './migrations/1790600000000-PushSubscriptions.js';
import { DailyPrompts1790700000000 } from './migrations/1790700000000-DailyPrompts.js';
import { Milestones1790800000000 } from './migrations/1790800000000-Milestones.js';
import { MentionNotifications1790900000000 } from './migrations/1790900000000-MentionNotifications.js';
import { Reactions1791000000000 } from './migrations/1791000000000-Reactions.js';
import { Announcements1791100000000 } from './migrations/1791100000000-Announcements.js';
import { QuestionsAndTags1791200000000 } from './migrations/1791200000000-QuestionsAndTags.js';
import { PostTag } from './entities/post-tag.entity.js';
import { Milestone } from './entities/milestone.entity.js';
import { PushSubscription } from './entities/push-subscription.entity.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('db.host'),
        port: config.get<number>('db.port'),
        username: config.get<string>('db.username'),
        password: config.get<string>('db.password'),
        database: config.get<string>('db.database'),
        entities: [
          User,
          RefreshToken,
          Post,
          PostMedia,
          Comment,
          Follow,
          Like,
          Notification,
          PushSubscription,
          Milestone,
          PostTag,
        ],
        // Opt-in only (DB_SYNCHRONIZE=true, for local development): if it were
        // on by default, a live server with NODE_ENV missing would let TypeORM
        // rewrite — and drop — real columns on startup.
        synchronize: config.get<boolean>('db.synchronize') ?? false,
        // Schema changes ship as migrations and apply themselves on startup;
        // TypeORM records each one in the `migrations` table so it only ever
        // runs once. (The email queue tables they created are no longer used.)
        migrations: [
          PostEmailNotifications1790136000000,
          ActivityEmails1790200000000,
          FollowEmails1790300000000,
          EmailDigests1790400000000,
          VerificationEmailRetry1790500000000,
          PushSubscriptions1790600000000,
          DailyPrompts1790700000000,
          Milestones1790800000000,
          MentionNotifications1790900000000,
          Reactions1791000000000,
          Announcements1791100000000,
          QuestionsAndTags1791200000000,
        ],
        migrationsRun: true,
        charset: 'utf8mb4',
        extra: { connectionLimit: 10 },
      }),
    }),
  ],
})
export class DatabaseModule {}
