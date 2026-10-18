import { type Relation } from 'typeorm';
import { User } from './user.entity.js';
export declare class PushSubscription {
    id: number;
    userId: number;
    user: Relation<User>;
    endpointHash: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    createdAt: Date;
}
