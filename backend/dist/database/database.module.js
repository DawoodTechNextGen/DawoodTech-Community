var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
let DatabaseModule = class DatabaseModule {
};
DatabaseModule = __decorate([
    Module({
        imports: [
            TypeOrmModule.forRootAsync({
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (config) => ({
                    type: 'mysql',
                    host: config.get('db.host'),
                    port: config.get('db.port'),
                    username: config.get('db.username'),
                    password: config.get('db.password'),
                    database: config.get('db.database'),
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
                    synchronize: config.get('nodeEnv') !== 'production',
                    extra: { connectionLimit: 10 },
                }),
            }),
        ],
    })
], DatabaseModule);
export { DatabaseModule };
//# sourceMappingURL=database.module.js.map