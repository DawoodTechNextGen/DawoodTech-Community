import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User, UserRole } from '../database/entities/user.entity.js';
export interface JwtPayload {
    sub: number;
    role: UserRole;
}
export interface AuthenticatedUser {
    id: number;
    role: UserRole;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly users;
    constructor(config: ConfigService, users: Repository<User>);
    validate(payload: JwtPayload): Promise<AuthenticatedUser>;
}
export {};
