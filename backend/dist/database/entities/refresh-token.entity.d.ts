import { type Relation } from 'typeorm';
import { User } from './user.entity.js';
export declare class RefreshToken {
    id: number;
    userId: number;
    user: Relation<User>;
    tokenHash: string;
    expiresAt: Date;
    revoked: boolean;
    createdAt: Date;
}
