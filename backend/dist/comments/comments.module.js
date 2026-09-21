var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from '../database/entities/comment.entity.js';
import { Post } from '../database/entities/post.entity.js';
import { CommentsController } from './comments.controller.js';
import { CommentsService } from './comments.service.js';
import { PostCommentsController } from './post-comments.controller.js';
let CommentsModule = class CommentsModule {
};
CommentsModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([Comment, Post])],
        controllers: [PostCommentsController, CommentsController],
        providers: [CommentsService],
        exports: [CommentsService],
    })
], CommentsModule);
export { CommentsModule };
//# sourceMappingURL=comments.module.js.map