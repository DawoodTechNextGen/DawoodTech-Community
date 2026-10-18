import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { UserRole } from '../database/entities/user.entity.js';
import { PostsService } from './posts.service.js';
import { PinPostDto } from './dto/pin-post.dto.js';

@Controller('admin/posts')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminPostsController {
  constructor(private readonly posts: PostsService) {}

  @Get('stats')
  async stats() {
    return this.posts.reviewStats();
  }

  @Get('pending')
  async pending() {
    return this.posts.findPending();
  }

  @Patch(':id/approve')
  async approve(@Param('id', ParseIntPipe) id: number, @CurrentUser() admin: AuthenticatedUser) {
    return this.posts.approve(id, admin.id);
  }

  @Patch(':id/pin')
  async pin(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: PinPostDto,
  ) {
    return this.posts.setPinned(id, admin.id, dto.pinned, dto.notifyAll);
  }

  @Patch(':id/reject')
  async reject(@Param('id', ParseIntPipe) id: number, @CurrentUser() admin: AuthenticatedUser) {
    return this.posts.reject(id, admin.id);
  }
}
