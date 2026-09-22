var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity.js';
import { FollowsModule } from '../follows/follows.module.js';
import { PostsModule } from '../posts/posts.module.js';
import { AdminUsersController } from './admin-users.controller.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
let UsersModule = class UsersModule {
};
UsersModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([User]), PostsModule, FollowsModule],
        controllers: [UsersController, AdminUsersController],
        providers: [UsersService],
        exports: [UsersService],
    })
], UsersModule);
export { UsersModule };
//# sourceMappingURL=users.module.js.map