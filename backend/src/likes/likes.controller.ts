import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Body,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { LikesService } from './likes.service.js';
import { ReactDto } from './dto/react.dto.js';

@Controller('posts/:id')
export class LikesController {
  constructor(private readonly likes: LikesService) {}

  @Post('like')
  async like(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReactDto,
  ) {
    await this.likes.like(id, user.id, dto.reaction);
    return { success: true };
  }

  @Delete('like')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlike(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    await this.likes.unlike(id, user.id);
  }

  @Get('likes')
  async likers(@Param('id', ParseIntPipe) id: number) {
    return this.likes.listLikers(id);
  }
}
