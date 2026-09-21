import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { CommentsService } from './comments.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';

@Controller('posts/:postId/comments')
export class PostCommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Post()
  async create(
    @Param('postId') postId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommentDto,
  ) {
    return this.comments.create(Number(postId), user.id, dto);
  }

  @Get()
  async list(
    @Param('postId') postId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.comments.findByPost(Number(postId), user.id);
  }
}
