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
import { FollowsService } from './follows.service.js';

@Controller('users/:id')
export class FollowsController {
  constructor(private readonly follows: FollowsService) {}

  @Post('follow')
  async follow(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.follows.follow(user.id, Number(id));
    return { success: true };
  }

  @Delete('follow')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollow(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.follows.unfollow(user.id, Number(id));
  }

  @Get('followers')
  async followers(@Param('id') id: string) {
    return this.follows.listFollowers(Number(id));
  }

  @Get('following')
  async following(@Param('id') id: string) {
    return this.follows.listFollowing(Number(id));
  }

  @Get('follow-status')
  async followStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const isFollowing = await this.follows.isFollowing(user.id, Number(id));
    return { isFollowing };
  }
}
