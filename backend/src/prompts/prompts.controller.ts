import { Controller, Get } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { PromptsService } from './prompts.service.js';

@Controller('prompts')
export class PromptsController {
  constructor(private readonly prompts: PromptsService) {}

  @Get('today')
  today(@CurrentUser() user: AuthenticatedUser) {
    return this.prompts.today(user.id);
  }
}
