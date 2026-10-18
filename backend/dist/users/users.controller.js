var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { FollowsService } from '../follows/follows.service.js';
import { PostsService } from '../posts/posts.service.js';
import { toPublicUser, toSelfUser } from './user.mapper.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UsersService } from './users.service.js';
const SUGGESTIONS_LIMIT = 5;
let UsersController = class UsersController {
    users;
    posts;
    follows;
    constructor(users, posts, follows) {
        this.users = users;
        this.posts = posts;
        this.follows = follows;
    }
    async search(search) {
        if (!search)
            return [];
        const results = await this.users.search(search);
        return results.map(toPublicUser);
    }
    async suggestions(authUser) {
        const followedIds = await this.follows.getFollowedIds(authUser.id);
        const results = await this.users.suggestions([...followedIds, authUser.id], SUGGESTIONS_LIMIT);
        return results.map(toPublicUser);
    }
    async updateMe(authUser, dto) {
        const user = await this.users.updateProfile(authUser.id, dto);
        return toSelfUser(user);
    }
    async getByUsername(username) {
        const user = await this.users.findByUsernameOrFail(username);
        return toPublicUser(user);
    }
    async progress(authUser) {
        const [user, followedIds, postCount] = await Promise.all([
            this.users.findByIdOrFail(authUser.id),
            this.follows.getFollowedIds(authUser.id),
            this.posts.countByUser(authUser.id),
        ]);
        return {
            hasAvatar: !!user.avatarUrl,
            hasBio: !!user.bio?.trim(),
            followingCount: followedIds.length,
            postCount,
        };
    }
    async getById(id) {
        const user = await this.users.findByIdOrFail(id);
        return toPublicUser(user);
    }
    async getPostsByUser(id, authUser) {
        return this.posts.findByUser(id, authUser?.id);
    }
};
__decorate([
    Get(),
    __param(0, Query('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "search", null);
__decorate([
    Get('suggestions'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "suggestions", null);
__decorate([
    Patch('me'),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateMe", null);
__decorate([
    Get('by-username/:username'),
    __param(0, Param('username')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getByUsername", null);
__decorate([
    Get('me/progress'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "progress", null);
__decorate([
    Get(':id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getById", null);
__decorate([
    Get(':id/posts'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getPostsByUser", null);
UsersController = __decorate([
    Controller('users'),
    __metadata("design:paramtypes", [UsersService,
        PostsService,
        FollowsService])
], UsersController);
export { UsersController };
//# sourceMappingURL=users.controller.js.map