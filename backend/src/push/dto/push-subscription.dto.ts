import { Type } from 'class-transformer';
import { IsString, IsUrl, MaxLength, ValidateNested } from 'class-validator';

class PushKeysDto {
  @IsString()
  @MaxLength(255)
  p256dh!: string;

  @IsString()
  @MaxLength(255)
  auth!: string;
}

/** The browser's PushSubscription.toJSON(), minus expirationTime. */
export class SubscribePushDto {
  @IsUrl({ protocols: ['https'], require_tld: false })
  @MaxLength(2000)
  endpoint!: string;

  @ValidateNested()
  @Type(() => PushKeysDto)
  keys!: PushKeysDto;
}

export class UnsubscribePushDto {
  @IsString()
  @MaxLength(2000)
  endpoint!: string;
}
