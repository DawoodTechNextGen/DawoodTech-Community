import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { UserRole } from '../database/entities/user.entity.js';
import { DigestEmailsService } from './digest-emails.service.js';

@Controller('admin/post-emails')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminPostEmailsController {
  constructor(private readonly digests: DigestEmailsService) {}

  @Get('stats')
  async stats() {
    return this.digests.stats();
  }
}
