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
import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { UserRole } from '../database/entities/user.entity.js';
import { ApprovePostDto } from './dto/approve-post.dto.js';
import { PostsService } from './posts.service.js';
let AdminPostsController = class AdminPostsController {
    posts;
    constructor(posts) {
        this.posts = posts;
    }
    async pending() {
        return this.posts.findPending();
    }
    async approve(id, admin, dto) {
        return this.posts.approve(Number(id), admin.id, dto?.notifyInterns ?? true);
    }
    async reject(id, admin) {
        return this.posts.reject(Number(id), admin.id);
    }
};
__decorate([
    Get('pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminPostsController.prototype, "pending", null);
__decorate([
    Patch(':id/approve'),
    __param(0, Param('id')),
    __param(1, CurrentUser()),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, ApprovePostDto]),
    __metadata("design:returntype", Promise)
], AdminPostsController.prototype, "approve", null);
__decorate([
    Patch(':id/reject'),
    __param(0, Param('id')),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminPostsController.prototype, "reject", null);
AdminPostsController = __decorate([
    Controller('admin/posts'),
    UseGuards(RolesGuard),
    Roles(UserRole.ADMIN),
    __metadata("design:paramtypes", [PostsService])
], AdminPostsController);
export { AdminPostsController };
//# sourceMappingURL=admin-posts.controller.js.map