import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { UserRole } from '../database/entities/user.entity.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import { toAdminUserResponse } from './user.mapper.js';
import { UsersService } from './users.service.js';

@Controller('admin/users')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async findAll() {
    const users = await this.users.findAll();
    return users.map(toAdminUserResponse);
  }

  @Patch(':id/status')
  async setStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    const user = await this.users.setStatus(Number(id), dto.status, admin.id);
    return toAdminUserResponse(user);
  }

  @Patch(':id/role')
  async setRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    const user = await this.users.setRole(Number(id), dto.role, admin.id);
    return toAdminUserResponse(user);
  }
}
