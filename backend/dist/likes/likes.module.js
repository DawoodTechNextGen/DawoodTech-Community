var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from '../database/entities/like.entity.js';
import { Post } from '../database/entities/post.entity.js';
import { User } from '../database/entities/user.entity.js';
import { LikesController } from './likes.controller.js';
import { LikesService } from './likes.service.js';
let LikesModule = class LikesModule {
};
LikesModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([Like, Post, User])],
        controllers: [LikesController],
        providers: [LikesService],
        exports: [LikesService],
    })
], LikesModule);
export { LikesModule };
//# sourceMappingURL=likes.module.js.map