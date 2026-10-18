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
import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors, } from '@nestjs/common';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { MAX_UPLOAD_BYTES, UploadsService } from './uploads.service.js';
let UploadsController = class UploadsController {
    uploads;
    constructor(uploads) {
        this.uploads = uploads;
    }
    async uploadImage(file) {
        if (!file)
            throw new BadRequestException('No file uploaded');
        const url = await this.uploads.saveImage(file, 'posts');
        return { url };
    }
};
__decorate([
    Post('image'),
    UseGuards(RateLimitGuard),
    RateLimit({ windowMs: 60 * 60_000, perIp: 60 }),
    UseInterceptors(FileInterceptor('file', {
        limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
    })),
    __param(0, UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadImage", null);
UploadsController = __decorate([
    Controller('uploads'),
    __metadata("design:paramtypes", [UploadsService])
], UploadsController);
export { UploadsController };
//# sourceMappingURL=uploads.controller.js.map