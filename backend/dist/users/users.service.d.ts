import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';
export declare class UsersService {
    private readonly users;
    constructor(users: Repository<User>);
    findByIdOrFail(id: number): Promise<User>;
    findByUsernameOrFail(username: string): Promise<User>;
    search(query: string): Promise<User[]>;
    updateProfile(id: number, dto: UpdateProfileDto): Promise<User>;
}
