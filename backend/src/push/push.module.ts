import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushSubscription } from '../database/entities/push-subscription.entity.js';
import { User } from '../database/entities/user.entity.js';
import { PushController } from './push.controller.js';
import { PushService } from './push.service.js';
import { ReviewAlertsListener } from './review-alerts.listener.js';

@Module({
  imports: [TypeOrmModule.forFeature([PushSubscription, User])],
  controllers: [PushController],
  providers: [PushService, ReviewAlertsListener],
  exports: [PushService],
})
export class PushModule {}
