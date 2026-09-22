import { IsEnum } from 'class-validator';
import { UserStatus } from '../../database/entities/user.entity.js';

export class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}
