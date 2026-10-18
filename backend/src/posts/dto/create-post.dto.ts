import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  MAX_POST_IMAGES,
  UPLOAD_URL_MESSAGE,
  UPLOAD_URL_PATTERN,
} from '../../uploads/upload-url.js';

export class CreatePostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_POST_IMAGES)
  @IsString({ each: true })
  @Matches(UPLOAD_URL_PATTERN, { each: true, message: UPLOAD_URL_MESSAGE })
  mediaUrls?: string[];

  /** Posted as an answer to today's question (see /prompts/today). */
  @IsOptional()
  @IsBoolean()
  answersPrompt?: boolean;

  /** Ask the community: comments become answers the author can accept. */
  @IsOptional()
  @IsBoolean()
  isQuestion?: boolean;
}
