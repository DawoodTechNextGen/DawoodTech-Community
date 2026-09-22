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
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { User } from '../database/entities/user.entity.js';
let UsersService = class UsersService {
    users;
    constructor(users) {
        this.users = users;
    }
    async findByIdOrFail(id) {
        const user = await this.users.findOneBy({ id });
        if (!user)
            throw new NotFoundException('User not found');
        return user;
    }
    async findByUsernameOrFail(username) {
        const user = await this.users.findOneBy({ username });
        if (!user)
            throw new NotFoundException('User not found');
        return user;
    }
    async search(query) {
        return this.users.find({
            where: [
                { username: ILike(`%${query}%`) },
                { fullName: ILike(`%${query}%`) },
            ],
            take: 20,
        });
    }
    async updateProfile(id, dto) {
        const user = await this.findByIdOrFail(id);
        if (dto.fullName !== undefined)
            user.fullName = dto.fullName;
        if (dto.bio !== undefined)
            user.bio = dto.bio;
        if (dto.avatarUrl !== undefined)
            user.avatarUrl = dto.avatarUrl;
        return this.users.save(user);
    }
    async findAll() {
        return this.users.find({ order: { createdAt: 'DESC' } });
    }
    async setStatus(id, status, actingAdminId) {
        if (id === actingAdminId) {
            throw new BadRequestException('You can\'t change your own account status');
        }
        const user = await this.findByIdOrFail(id);
        user.status = status;
        return this.users.save(user);
    }
    async setRole(id, role, actingAdminId) {
        if (id === actingAdminId) {
            throw new BadRequestException('You can\'t change your own role');
        }
        const user = await this.findByIdOrFail(id);
        user.role = role;
        return this.users.save(user);
    }
};
UsersService = __decorate([
    Injectable(),
    __param(0, InjectRepository(User)),
    __metadata("design:paramtypes", [Repository])
], UsersService);
export { UsersService };
//# sourceMappingURL=users.service.js.map