import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import configuration from './config/configuration.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { PostsModule } from './posts/posts.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { PushModule } from './push/push.module.js';
import { PromptsModule } from './prompts/prompts.module.js';
import { MilestonesModule } from './milestones/milestones.module.js';
import { CommunityModule } from './community/community.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    PostsModule,
    NotificationsModule,
    UploadsModule,
    PushModule,
    PromptsModule,
    MilestonesModule,
    CommunityModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
