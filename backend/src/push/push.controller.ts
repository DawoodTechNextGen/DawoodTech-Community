import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { SubscribePushDto, UnsubscribePushDto } from './dto/push-subscription.dto.js';
import { PushService } from './push.service.js';

@Controller('push')
export class PushController {
  constructor(private readonly push: PushService) {}

  /** Null when push isn't configured on this server. */
  @Get('public-key')
  publicKey() {
    return { publicKey: this.push.publicKey };
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  async subscribe(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubscribePushDto) {
    await this.push.subscribe(user.id, dto);
  }

  @Post('unsubscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribe(@Body() dto: UnsubscribePushDto) {
    await this.push.unsubscribe(dto.endpoint);
  }
}
