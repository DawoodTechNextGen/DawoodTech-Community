import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const UPLOAD_ROOT = join(process.cwd(), 'uploads');

@Injectable()
export class UploadsService {
  async saveImage(
    file: { mimetype: string; size: number; buffer: Buffer; originalname: string },
    subfolder: 'posts' | 'avatars',
  ): Promise<string> {
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
}
