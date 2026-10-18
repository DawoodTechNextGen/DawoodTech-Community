var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushSubscription } from '../database/entities/push-subscription.entity.js';
import { User } from '../database/entities/user.entity.js';
import { PushController } from './push.controller.js';
import { PushService } from './push.service.js';
import { ReviewAlertsListener } from './review-alerts.listener.js';
let PushModule = class PushModule {
};
PushModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([PushSubscription, User])],
        controllers: [PushController],
        providers: [PushService, ReviewAlertsListener],
        exports: [PushService],
    })
], PushModule);
export { PushModule };
//# sourceMappingURL=push.module.js.map