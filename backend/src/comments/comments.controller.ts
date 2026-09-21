import { Controller, Delete, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { CommentsService } from './comments.service.js';

@Controller('comments')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.comments.remove(Number(id), user.id);
  }
}
