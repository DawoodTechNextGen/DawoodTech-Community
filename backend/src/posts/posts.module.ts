import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsModule } from '../comments/comments.module.js';
import { FollowsModule } from '../follows/follows.module.js';
import { LikesModule } from '../likes/likes.module.js';
import { PostMedia } from '../database/entities/post-media.entity.js';
import { Post } from '../database/entities/post.entity.js';
import { AdminPostsController } from './admin-posts.controller.js';
import { PostsController } from './posts.controller.js';
import { PostsService } from './posts.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostMedia]),
    CommentsModule,
    FollowsModule,
    LikesModule,
  ],
  controllers: [PostsController, AdminPostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
