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
import { PostEmailQueue } from './entities/post-email-queue.entity.js';
import { PostEmailNotifications1790136000000 } from './migrations/1790136000000-PostEmailNotifications.js';
import { ActivityEmails1790200000000 } from './migrations/1790200000000-ActivityEmails.js';
import { FollowEmails1790300000000 } from './migrations/1790300000000-FollowEmails.js';
import { ActivityEmailQueue } from './entities/activity-email-queue.entity.js';

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
          PostEmailQueue,
          ActivityEmailQueue,
        ],
        synchronize: config.get<string>('nodeEnv') !== 'production',
        // Schema changes for production (where synchronize is off) ship as
        // migrations and apply themselves on startup; TypeORM records each
        // one in the `migrations` table so it only ever runs once.
        migrations: [
          PostEmailNotifications1790136000000,
          ActivityEmails1790200000000,
          FollowEmails1790300000000,
        ],
        migrationsRun: true,
        charset: 'utf8mb4',
        extra: { connectionLimit: 10 },
      }),
    }),
  ],
})
export class DatabaseModule {}
