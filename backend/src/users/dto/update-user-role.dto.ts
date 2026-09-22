import { IsEnum } from 'class-validator';
import { UserRole } from '../../database/entities/user.entity.js';

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
