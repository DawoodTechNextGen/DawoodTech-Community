import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../database/entities/user.entity.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async findByIdOrFail(id: number): Promise<User> {
    const user = await this.users.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByUsernameOrFail(username: string): Promise<User> {
    const user = await this.users.findOneBy({ username });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async search(query: string): Promise<User[]> {
    return this.users.find({
      where: [
        { username: ILike(`%${query}%`) },
        { fullName: ILike(`%${query}%`) },
      ],
      take: 20,
    });
  }

  async updateProfile(id: number, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findByIdOrFail(id);
    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
    return this.users.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.users.find({ order: { createdAt: 'DESC' } });
  }

  async suggestions(excludeIds: number[], limit: number): Promise<User[]> {
    const qb = this.users
      .createQueryBuilder('user')
      .where('user.status = :status', { status: UserStatus.ACTIVE })
      .orderBy('user.createdAt', 'DESC')
      .take(limit);
    if (excludeIds.length > 0) {
      qb.andWhere('user.id NOT IN (:...excludeIds)', { excludeIds });
    }
    return qb.getMany();
  }

  async setStatus(id: number, status: UserStatus, actingAdminId: number): Promise<User> {
    if (id === actingAdminId) {
      throw new BadRequestException('You can\'t change your own account status');
    }
    const user = await this.findByIdOrFail(id);
    user.status = status;
    return this.users.save(user);
  }

  async setRole(id: number, role: UserRole, actingAdminId: number): Promise<User> {
    if (id === actingAdminId) {
      throw new BadRequestException('You can\'t change your own role');
    }
    const user = await this.findByIdOrFail(id);
    user.role = role;
    return this.users.save(user);
  }
}
