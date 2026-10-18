import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post as HttpPost,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';
import { PostsService } from './posts.service.js';

@Controller('posts')
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @HttpPost()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePostDto) {
    return this.posts.create(user.id, dto);
  }

  @Get('feed')
  async feed(@CurrentUser() user: AuthenticatedUser, @Query('cursor') cursor?: string) {
    return this.posts.findFeed(cursor, user.id);
  }

  @Get('explore')
  async explore(@CurrentUser() user: AuthenticatedUser, @Query('cursor') cursor?: string) {
    return this.posts.findExplore(cursor, user.id);
  }

  @Get('questions')
  async questions(@CurrentUser() user: AuthenticatedUser, @Query('cursor') cursor?: string) {
    return this.posts.findQuestions(cursor, user.id);
  }

  @Get('tags/trending')
  async trendingTags() {
    return this.posts.trendingTags();
  }

  @Get('tags/:tag')
  async byTag(
    @Param('tag') tag: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('cursor') cursor?: string,
  ) {
    return this.posts.findByTag(tag, cursor, user.id);
  }

  @Get('search')
  async search(@CurrentUser() user: AuthenticatedUser, @Query('q') q?: string) {
    const query = q?.trim() ?? '';
    return query.length >= 2 ? this.posts.search(query.slice(0, 100), user.id) : [];
  }

  @Get('pinned')
  async pinned(@CurrentUser() user: AuthenticatedUser) {
    return this.posts.findPinned(user.id);
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    return this.posts.getByIdOrFail(id, user.id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePostDto,
  ) {
    return this.posts.updateOwn(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    await this.posts.delete(id, user);
  }
}
