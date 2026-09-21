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
        ],
        synchronize: config.get<string>('nodeEnv') !== 'production',
        extra: { connectionLimit: 10 },
      }),
    }),
  ],
})
export class DatabaseModule {}
