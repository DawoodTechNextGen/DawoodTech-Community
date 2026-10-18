var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const UPLOAD_ROOT = join(process.cwd(), 'uploads');
const IMAGE_SIGNATURES = [
    {
        ext: '.jpg',
        matches: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
    },
    {
        ext: '.png',
        matches: (b) => b.length > 8 &&
            b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    },
    {
        ext: '.webp',
        matches: (b) => b.length > 12 &&
            b.subarray(0, 4).toString('ascii') === 'RIFF' &&
            b.subarray(8, 12).toString('ascii') === 'WEBP',
    },
];
let UploadsService = class UploadsService {
    async saveImage(file, subfolder) {
        if (file.size > MAX_UPLOAD_BYTES) {
            throw new BadRequestException('Image must be 5MB or smaller');
        }
        const ext = IMAGE_SIGNATURES.find((s) => s.matches(file.buffer))?.ext;
        if (!ext) {
            throw new BadRequestException('Only JPEG, PNG or WEBP images are allowed');
        }
        const dir = join(UPLOAD_ROOT, subfolder);
        await mkdir(dir, { recursive: true });
        const filename = `${Date.now()}-${randomUUID()}${ext}`;
        await writeFile(join(dir, filename), file.buffer);
        return `/uploads/${subfolder}/${filename}`;
    }
};
UploadsService = __decorate([
    Injectable()
], UploadsService);
export { UploadsService };
//# sourceMappingURL=uploads.service.js.map