import { IsBoolean, IsOptional } from 'class-validator';

export class PinPostDto {
  @IsBoolean()
  pinned!: boolean;

  /** Also send every member an announcement notification. */
  @IsOptional()
  @IsBoolean()
  notifyAll?: boolean;
}
