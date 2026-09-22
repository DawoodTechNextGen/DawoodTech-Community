import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../../database/entities/user.entity.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../../auth/jwt.strategy.js';

// Looks the acting user's role up fresh from the database rather than trusting
// the JWT claim, since a role/status change (e.g. an admin promotion or a
// block) must take effect immediately — not only after the access token
// they were issued before the change naturally expires.
@Injectable()
export class RolesGuard {
  constructor(
    private reflector: Reflector,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const authUser = request.user as AuthenticatedUser | undefined;
    if (!authUser) {
      throw new ForbiddenException('Insufficient role for this action');
    }

    const current = await this.users.findOneBy({ id: authUser.id });
    if (
      !current ||
      current.status === UserStatus.DISABLED ||
      !requiredRoles.includes(current.role)
    ) {
      throw new ForbiddenException('Insufficient role for this action');
    }
    return true;
  }
}
