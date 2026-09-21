import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { LikesService } from './likes.service.js';

@Controller('posts/:id')
export class LikesController {
  constructor(private readonly likes: LikesService) {}

  @Post('like')
  async like(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.likes.like(Number(id), user.id);
    return { success: true };
  }

  @Delete('like')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlike(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.likes.unlike(Number(id), user.id);
  }

  @Get('likes')
  async likers(@Param('id') id: string) {
    return this.likes.listLikers(Number(id));
  }
}
