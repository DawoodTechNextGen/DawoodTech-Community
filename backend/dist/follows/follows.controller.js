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
import { Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { FollowsService } from './follows.service.js';
let FollowsController = class FollowsController {
    follows;
    constructor(follows) {
        this.follows = follows;
    }
    async follow(id, user) {
        await this.follows.follow(user.id, id);
        return { success: true };
    }
    async unfollow(id, user) {
        await this.follows.unfollow(user.id, id);
    }
    async followers(id) {
        return this.follows.listFollowers(id);
    }
    async following(id) {
        return this.follows.listFollowing(id);
    }
    async followStatus(id, user) {
        const isFollowing = await this.follows.isFollowing(user.id, id);
        return { isFollowing };
    }
};
__decorate([
    Post('follow'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], FollowsController.prototype, "follow", null);
__decorate([
    Delete('follow'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], FollowsController.prototype, "unfollow", null);
__decorate([
    Get('followers'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], FollowsController.prototype, "followers", null);
__decorate([
    Get('following'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], FollowsController.prototype, "following", null);
__decorate([
    Get('follow-status'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], FollowsController.prototype, "followStatus", null);
FollowsController = __decorate([
    Controller('users/:id'),
    __metadata("design:paramtypes", [FollowsService])
], FollowsController);
export { FollowsController };
//# sourceMappingURL=follows.controller.js.map