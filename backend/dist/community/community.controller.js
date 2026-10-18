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
import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { UserRole } from '../database/entities/user.entity.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CommunityService } from './community.service.js';
let CommunityController = class CommunityController {
    community;
    constructor(community) {
        this.community = community;
    }
    leaderboard(user) {
        return this.community.leaderboard(user.id);
    }
    adminStats() {
        return this.community.adminStats();
    }
    badges(id) {
        return this.community.badges(id);
    }
};
__decorate([
    Get('community/leaderboard'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CommunityController.prototype, "leaderboard", null);
__decorate([
    Get('admin/stats'),
    UseGuards(RolesGuard),
    Roles(UserRole.ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CommunityController.prototype, "adminStats", null);
__decorate([
    Get('users/:id/badges'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CommunityController.prototype, "badges", null);
CommunityController = __decorate([
    Controller(),
    __metadata("design:paramtypes", [CommunityService])
], CommunityController);
export { CommunityController };
//# sourceMappingURL=community.controller.js.map