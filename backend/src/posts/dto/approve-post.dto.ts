import { IsBoolean, IsOptional } from 'class-validator';

export class ApprovePostDto {
  /** Include this post in the daily email digest to interns and members. Defaults to true. */
  @IsOptional()
  @IsBoolean()
  notifyInterns?: boolean;
}
