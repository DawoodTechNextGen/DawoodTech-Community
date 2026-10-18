import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { PushSubscription } from '../database/entities/push-subscription.entity.js';
import type { SubscribePushDto } from './dto/push-subscription.dto.js';
export interface PushMessage {
    title: string;
    body: string;
    url: string;
    tag?: string;
    badge?: number;
}
export declare class PushService {
    private readonly subscriptions;
    private readonly logger;
    readonly publicKey: string | null;
    constructor(subscriptions: Repository<PushSubscription>, config: ConfigService);
    subscribe(userId: number, dto: SubscribePushDto): Promise<void>;
    unsubscribe(endpoint: string): Promise<void>;
    sendToUser(userId: number | string, message: PushMessage): Promise<void>;
}
