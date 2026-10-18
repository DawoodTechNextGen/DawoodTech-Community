import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { UPLOAD_URL_MESSAGE, UPLOAD_URL_PATTERN } from '../../uploads/upload-url.js';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(UPLOAD_URL_PATTERN, { message: UPLOAD_URL_MESSAGE })
  avatarUrl?: string;
}
