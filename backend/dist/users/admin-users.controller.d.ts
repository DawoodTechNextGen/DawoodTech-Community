import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import { UsersService } from './users.service.js';
export declare class AdminUsersController {
    private readonly users;
    constructor(users: UsersService);
    findAll(): Promise<import("./user.mapper.js").AdminUserResponse[]>;
    setStatus(id: string, dto: UpdateUserStatusDto, admin: AuthenticatedUser): Promise<import("./user.mapper.js").AdminUserResponse>;
    setRole(id: string, dto: UpdateUserRoleDto, admin: AuthenticatedUser): Promise<import("./user.mapper.js").AdminUserResponse>;
}
