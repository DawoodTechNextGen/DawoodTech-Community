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
import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { LikesService } from './likes.service.js';
let LikesController = class LikesController {
    likes;
    constructor(likes) {
        this.likes = likes;
    }
    async like(id, user) {
        await this.likes.like(Number(id), user.id);
        return { success: true };
    }
    async unlike(id, user) {
        await this.likes.unlike(Number(id), user.id);
    }
    async likers(id) {
        return this.likes.listLikers(Number(id));
    }
};
__decorate([
    Post('like'),
    __param(0, Param('id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LikesController.prototype, "like", null);
__decorate([
    Delete('like'),
    HttpCode(HttpStatus.NO_CONTENT),
    __param(0, Param('id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LikesController.prototype, "unlike", null);
__decorate([
    Get('likes'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LikesController.prototype, "likers", null);
LikesController = __decorate([
    Controller('posts/:id'),
    __metadata("design:paramtypes", [LikesService])
], LikesController);
export { LikesController };
//# sourceMappingURL=likes.controller.js.map