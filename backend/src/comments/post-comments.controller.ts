import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { CommentsService } from './comments.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';

@Controller('posts/:postId/comments')
export class PostCommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Post()
  async create(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommentDto,
  ) {
    return this.comments.create(postId, user.id, dto);
  }

  @Get()
  async list(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.comments.findByPost(postId, user.id);
  }
}
