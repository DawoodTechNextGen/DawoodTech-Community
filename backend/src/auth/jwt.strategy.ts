import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../database/entities/user.entity.js';

export interface JwtPayload {
  sub: number;
  role: UserRole;
}

export interface AuthenticatedUser {
  id: number;
  role: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret')!,
    });
  }

  // Reads status and role fresh from the database, so blocking a member or
  // changing their role takes effect on their very next request rather than
  // when their access token happens to expire.
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.users.findOne({
      where: { id: payload.sub },
      select: { id: true, role: true, status: true },
    });
    if (!user || user.status === UserStatus.DISABLED) {
      throw new UnauthorizedException('ACCOUNT_DISABLED');
    }
    return { id: payload.sub, role: user.role };
  }
}
