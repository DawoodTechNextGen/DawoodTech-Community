var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsModule } from '../comments/comments.module.js';
import { FollowsModule } from '../follows/follows.module.js';
import { LikesModule } from '../likes/likes.module.js';
import { PostMedia } from '../database/entities/post-media.entity.js';
import { Post } from '../database/entities/post.entity.js';
import { User } from '../database/entities/user.entity.js';
import { AdminPostsController } from './admin-posts.controller.js';
import { PostsController } from './posts.controller.js';
import { PostsService } from './posts.service.js';
let PostsModule = class PostsModule {
};
PostsModule = __decorate([
    Module({
        imports: [
            TypeOrmModule.forFeature([Post, PostMedia, User]),
            CommentsModule,
            FollowsModule,
            LikesModule,
        ],
        controllers: [PostsController, AdminPostsController],
        providers: [PostsService],
        exports: [PostsService],
    })
], PostsModule);
export { PostsModule };
//# sourceMappingURL=posts.module.js.map