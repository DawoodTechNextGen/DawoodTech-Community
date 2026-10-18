import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { FollowsService } from './follows.service.js';

@Controller('users/:id')
export class FollowsController {
  constructor(private readonly follows: FollowsService) {}

  @Post('follow')
  async follow(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    await this.follows.follow(user.id, id);
    return { success: true };
  }

  @Delete('follow')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollow(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    await this.follows.unfollow(user.id, id);
  }

  @Get('followers')
  async followers(@Param('id', ParseIntPipe) id: number) {
    return this.follows.listFollowers(id);
  }

  @Get('following')
  async following(@Param('id', ParseIntPipe) id: number) {
    return this.follows.listFollowing(id);
  }

  @Get('follow-status')
  async followStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const isFollowing = await this.follows.isFollowing(user.id, id);
    return { isFollowing };
  }
}
