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
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../../database/entities/user.entity.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
let RolesGuard = class RolesGuard {
    reflector;
    users;
    constructor(reflector, users) {
        this.reflector = reflector;
        this.users = users;
    }
    async canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(ROLES_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredRoles || requiredRoles.length === 0)
            return true;
        const request = context.switchToHttp().getRequest();
        const authUser = request.user;
        if (!authUser) {
            throw new ForbiddenException('Insufficient role for this action');
        }
        const current = await this.users.findOneBy({ id: authUser.id });
        if (!current ||
            current.status === UserStatus.DISABLED ||
            !requiredRoles.includes(current.role)) {
            throw new ForbiddenException('Insufficient role for this action');
        }
        return true;
    }
};
RolesGuard = __decorate([
    Injectable(),
    __param(1, InjectRepository(User)),
    __metadata("design:paramtypes", [Reflector,
        Repository])
], RolesGuard);
export { RolesGuard };
//# sourceMappingURL=roles.guard.js.map