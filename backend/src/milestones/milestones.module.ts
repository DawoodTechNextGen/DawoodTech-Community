import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Milestone } from '../database/entities/milestone.entity.js';
import { Post } from '../database/entities/post.entity.js';
import { User } from '../database/entities/user.entity.js';
import { MilestonesService } from './milestones.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Milestone, Post, User])],
  providers: [MilestonesService],
})
export class MilestonesModule {}
