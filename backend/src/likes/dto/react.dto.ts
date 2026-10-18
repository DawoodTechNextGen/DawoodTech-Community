import { IsEnum, IsOptional } from 'class-validator';
import { Reaction } from '../../database/entities/like.entity.js';

export class ReactDto {
  /** Defaults to a plain like (what older app versions send). */
  @IsOptional()
  @IsEnum(Reaction)
  reaction?: Reaction;
}
