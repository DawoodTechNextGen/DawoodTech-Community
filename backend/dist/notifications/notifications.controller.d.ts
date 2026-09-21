import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { NotificationsService } from './notifications.service.js';
export declare class NotificationsController {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    list(user: AuthenticatedUser, cursor?: string): Promise<{
        items: import("./notification.mapper.js").NotificationResponse[];
        nextCursor: string | null;
    }>;
    unreadCount(user: AuthenticatedUser): Promise<{
        count: number;
    }>;
    markRead(id: string, user: AuthenticatedUser): Promise<{
        success: boolean;
    }>;
    markAllRead(user: AuthenticatedUser): Promise<{
        success: boolean;
    }>;
}
