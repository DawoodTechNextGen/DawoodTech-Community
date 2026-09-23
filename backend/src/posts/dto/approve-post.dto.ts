import { IsBoolean, IsOptional } from 'class-validator';

export class ApprovePostDto {
  /** Email every TaskDesk intern about this post. Defaults to true. */
  @IsOptional()
  @IsBoolean()
  notifyInterns?: boolean;
}
