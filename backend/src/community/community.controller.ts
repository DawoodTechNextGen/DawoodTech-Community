import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { UserRole } from '../database/entities/user.entity.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { CommunityService } from './community.service.js';

@Controller()
export class CommunityController {
  constructor(private readonly community: CommunityService) {}

  @Get('community/leaderboard')
  leaderboard(@CurrentUser() user: AuthenticatedUser) {
    return this.community.leaderboard(user.id);
  }

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  adminStats() {
    return this.community.adminStats();
  }

  @Get('users/:id/badges')
  badges(@Param('id', ParseIntPipe) id: number) {
    return this.community.badges(id);
  }
}
