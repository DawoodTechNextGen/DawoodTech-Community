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

export function toNotificationResponse(n: Notification): NotificationResponse {
  return {
    id: n.id,
    type: n.type,
    actorId: n.actorId,
    actorName: n.actor?.fullName ?? '',
    actorAvatarUrl: n.actor?.avatarUrl ?? null,
    postId: n.postId,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  };
}
