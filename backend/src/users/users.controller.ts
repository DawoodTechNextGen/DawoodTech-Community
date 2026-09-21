import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { PostsService } from '../posts/posts.service.js';
import { toPublicUser } from './user.mapper.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly posts: PostsService,
  ) {}

  @Get()
  async search(@Query('search') search?: string) {
    if (!search) return [];
    const results = await this.users.search(search);
    return results.map(toPublicUser);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() authUser: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const user = await this.users.updateProfile(authUser.id, dto);
    return toPublicUser(user);
  }

  @Get('by-username/:username')
  async getByUsername(@Param('username') username: string) {
    const user = await this.users.findByUsernameOrFail(username);
    return toPublicUser(user);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const user = await this.users.findByIdOrFail(Number(id));
    return toPublicUser(user);
  }

  @Get(':id/posts')
  async getPostsByUser(
    @Param('id') id: string,
    @CurrentUser() authUser: AuthenticatedUser,
  ) {
    return this.posts.findByUser(Number(id), authUser?.id);
  }
}
