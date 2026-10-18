var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../database/entities/notification.entity.js';
import { User } from '../database/entities/user.entity.js';
import { PushModule } from '../push/push.module.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsGateway } from './notifications.gateway.js';
import { NotificationsService } from './notifications.service.js';
let NotificationsModule = class NotificationsModule {
};
NotificationsModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([Notification, User]), JwtModule.register({}), PushModule],
        controllers: [NotificationsController],
        providers: [NotificationsService, NotificationsGateway],
        exports: [NotificationsService],
    })
], NotificationsModule);
export { NotificationsModule };
//# sourceMappingURL=notifications.module.js.map