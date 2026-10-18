import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { FollowsService } from '../follows/follows.service.js';
import { PostsService } from '../posts/posts.service.js';
import { toPublicUser, toSelfUser } from './user.mapper.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UsersService } from './users.service.js';

const SUGGESTIONS_LIMIT = 5;

@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly posts: PostsService,
    private readonly follows: FollowsService,
  ) {}

  @Get()
  async search(@Query('search') search?: string) {
    if (!search) return [];
    const results = await this.users.search(search);
    return results.map(toPublicUser);
  }

  @Get('suggestions')
  async suggestions(@CurrentUser() authUser: AuthenticatedUser) {
    const followedIds = await this.follows.getFollowedIds(authUser.id);
    const results = await this.users.suggestions([...followedIds, authUser.id], SUGGESTIONS_LIMIT);
    return results.map(toPublicUser);
  }

  @Patch('me')
  async updateMe(@CurrentUser() authUser: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    const user = await this.users.updateProfile(authUser.id, dto);
    return toSelfUser(user);
  }

  @Get('by-username/:username')
  async getByUsername(@Param('username') username: string) {
    const user = await this.users.findByUsernameOrFail(username);
    return toPublicUser(user);
  }

  /** Drives the "Getting started" checklist on the feed. */
  @Get('me/progress')
  async progress(@CurrentUser() authUser: AuthenticatedUser) {
    const [user, followedIds, postCount] = await Promise.all([
      this.users.findByIdOrFail(authUser.id),
      this.follows.getFollowedIds(authUser.id),
      this.posts.countByUser(authUser.id),
    ]);
    return {
      hasAvatar: !!user.avatarUrl,
      hasBio: !!user.bio?.trim(),
      followingCount: followedIds.length,
      postCount,
    };
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.users.findByIdOrFail(id);
    return toPublicUser(user);
  }

  @Get(':id/posts')
  async getPostsByUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() authUser: AuthenticatedUser,
  ) {
    return this.posts.findByUser(id, authUser?.id);
  }
}
