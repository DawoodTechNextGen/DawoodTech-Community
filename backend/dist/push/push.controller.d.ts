import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { SubscribePushDto, UnsubscribePushDto } from './dto/push-subscription.dto.js';
import { PushService } from './push.service.js';
export declare class PushController {
    private readonly push;
    constructor(push: PushService);
    publicKey(): {
        publicKey: string | null;
    };
    subscribe(user: AuthenticatedUser, dto: SubscribePushDto): Promise<void>;
    unsubscribe(dto: UnsubscribePushDto): Promise<void>;
}
