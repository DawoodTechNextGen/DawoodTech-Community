import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../database/entities/user.entity.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';
export declare class UsersService {
    private readonly users;
    constructor(users: Repository<User>);
    findByIdOrFail(id: number): Promise<User>;
    findByUsernameOrFail(username: string): Promise<User>;
    search(query: string): Promise<User[]>;
    updateProfile(id: number, dto: UpdateProfileDto): Promise<User>;
    findAll(): Promise<User[]>;
    suggestions(excludeIds: number[], limit: number): Promise<User[]>;
    setStatus(id: number, status: UserStatus, actingAdminId: number): Promise<User>;
    setRole(id: number, role: UserRole, actingAdminId: number): Promise<User>;
}
