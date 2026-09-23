var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { UserRole } from '../database/entities/user.entity.js';
import { DigestEmailsService } from './digest-emails.service.js';
let AdminPostEmailsController = class AdminPostEmailsController {
    digests;
    constructor(digests) {
        this.digests = digests;
    }
    async stats() {
        return this.digests.stats();
    }
};
__decorate([
    Get('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminPostEmailsController.prototype, "stats", null);
AdminPostEmailsController = __decorate([
    Controller('admin/post-emails'),
    UseGuards(RolesGuard),
    Roles(UserRole.ADMIN),
    __metadata("design:paramtypes", [DigestEmailsService])
], AdminPostEmailsController);
export { AdminPostEmailsController };
//# sourceMappingURL=admin-post-emails.controller.js.map