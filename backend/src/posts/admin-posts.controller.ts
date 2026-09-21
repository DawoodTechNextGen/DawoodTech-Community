import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { UserRole } from '../database/entities/user.entity.js';
import { PostsService } from './posts.service.js';

@Controller('admin/posts')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminPostsController {
  constructor(private readonly posts: PostsService) {}

  @Get('pending')
  async pending() {
    return this.posts.findPending();
  }

  @Patch(':id/approve')
  async approve(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.posts.approve(Number(id), admin.id);
  }

  @Patch(':id/reject')
  async reject(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.posts.reject(Number(id), admin.id);
  }
}
