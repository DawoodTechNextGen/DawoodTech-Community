import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity.js';
import { type PostSubmittedEvent } from '../notifications/notification.events.js';
import { PushService } from './push.service.js';
export declare class ReviewAlertsListener {
    private readonly users;
    private readonly push;
    constructor(users: Repository<User>, push: PushService);
    handlePostSubmitted({ authorId }: PostSubmittedEvent): Promise<void>;
}
