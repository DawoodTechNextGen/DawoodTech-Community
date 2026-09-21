import type { Notification } from '../database/entities/notification.entity.js';
export interface NotificationResponse {
    id: number;
    type: string;
    actorId: number;
    actorName: string;
    actorAvatarUrl: string | null;
    postId: number | null;
    isRead: boolean;
    createdAt: string;
}
export declare function toNotificationResponse(n: Notification): NotificationResponse;
