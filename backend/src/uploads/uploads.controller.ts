import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard.js';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { MAX_UPLOAD_BYTES, UploadsService } from './uploads.service.js';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('image')
  @UseGuards(RateLimitGuard)
  @RateLimit({ windowMs: 60 * 60_000, perIp: 60 })
  // Multer stops reading past the limit, so an oversized upload never sits
  // whole in memory.
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
    }),
  )
  async uploadImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const url = await this.uploads.saveImage(file, 'posts');
    return { url };
  }
}
