var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
import { PostEmailsModule } from './post-emails/post-emails.module.js';
import { ActivityEmailsModule } from './activity-emails/activity-emails.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
            EventEmitterModule.forRoot(),
            DatabaseModule,
            AuthModule,
            UsersModule,
            PostsModule,
            NotificationsModule,
            UploadsModule,
            PostEmailsModule,
            ActivityEmailsModule,
        ],
        providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
    })
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map