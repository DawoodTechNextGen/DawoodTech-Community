import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from '../database/entities/like.entity.js';
import { Post } from '../database/entities/post.entity.js';
import { User } from '../database/entities/user.entity.js';
import { LikesController } from './likes.controller.js';
import { LikesService } from './likes.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Like, Post, User])],
  controllers: [LikesController],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule {}
