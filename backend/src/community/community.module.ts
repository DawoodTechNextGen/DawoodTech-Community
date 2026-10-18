import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity.js';
import { PromptsModule } from '../prompts/prompts.module.js';
import { CommunityController } from './community.controller.js';
import { CommunityService } from './community.service.js';

@Module({
  imports: [PromptsModule, TypeOrmModule.forFeature([User])],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
