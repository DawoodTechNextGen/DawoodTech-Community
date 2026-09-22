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
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import { toAdminUserResponse } from './user.mapper.js';
import { UsersService } from './users.service.js';
let AdminUsersController = class AdminUsersController {
    users;
    constructor(users) {
        this.users = users;
    }
    async findAll() {
        const users = await this.users.findAll();
        return users.map(toAdminUserResponse);
    }
    async setStatus(id, dto, admin) {
        const user = await this.users.setStatus(Number(id), dto.status, admin.id);
        return toAdminUserResponse(user);
    }
    async setRole(id, dto, admin) {
        const user = await this.users.setRole(Number(id), dto.role, admin.id);
        return toAdminUserResponse(user);
    }
};
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "findAll", null);
__decorate([
    Patch(':id/status'),
    __param(0, Param('id')),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateUserStatusDto, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "setStatus", null);
__decorate([
    Patch(':id/role'),
    __param(0, Param('id')),
    __param(1, Body()),
    __param(2, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateUserRoleDto, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "setRole", null);
AdminUsersController = __decorate([
    Controller('admin/users'),
    UseGuards(RolesGuard),
    Roles(UserRole.ADMIN),
    __metadata("design:paramtypes", [UsersService])
], AdminUsersController);
export { AdminUsersController };
//# sourceMappingURL=admin-users.controller.js.map