import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from '../database/entities/comment.entity.js';
import { Post } from '../database/entities/post.entity.js';
import { CommentsController } from './comments.controller.js';
import { CommentsService } from './comments.service.js';
import { PostCommentsController } from './post-comments.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Post])],
  controllers: [PostCommentsController, CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
