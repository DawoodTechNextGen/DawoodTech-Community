import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity.js';
export declare class RolesGuard {
    private reflector;
    private readonly users;
    constructor(reflector: Reflector, users: Repository<User>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
