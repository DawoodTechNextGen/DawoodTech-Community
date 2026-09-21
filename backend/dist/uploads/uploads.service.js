var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const UPLOAD_ROOT = join(process.cwd(), 'uploads');
let UploadsService = class UploadsService {
    async saveImage(file, subfolder) {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
            throw new BadRequestException('Only JPEG, PNG or WEBP images are allowed');
        }
        if (file.size > MAX_SIZE_BYTES) {
            throw new BadRequestException('Image must be 5MB or smaller');
        }
        const dir = join(UPLOAD_ROOT, subfolder);
        await mkdir(dir, { recursive: true });
        const filename = `${Date.now()}-${randomUUID()}${extname(file.originalname) || '.jpg'}`;
        await writeFile(join(dir, filename), file.buffer);
        return `/uploads/${subfolder}/${filename}`;
    }
};
UploadsService = __decorate([
    Injectable()
], UploadsService);
export { UploadsService };
//# sourceMappingURL=uploads.service.js.map