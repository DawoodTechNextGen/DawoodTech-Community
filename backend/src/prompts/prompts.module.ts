import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from '../database/entities/comment.entity.js';
import { Post } from '../database/entities/post.entity.js';
import { PromptsController } from './prompts.controller.js';
import { PromptsService } from './prompts.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Comment])],
  controllers: [PromptsController],
  providers: [PromptsService],
  exports: [PromptsService],
})
export class PromptsModule {}
