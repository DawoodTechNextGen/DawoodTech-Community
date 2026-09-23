import { ActivityEmailType } from '../database/entities/activity-email-queue.entity.js';
import type { CommentPostedEvent } from '../notifications/notification.events.js';

export interface ActivityTarget {
  userId: number;
  type: ActivityEmailType;
}

/**
 * Who hears about a new comment — each person at most once, by priority:
 *   1. the post's owner                  → "commented on your post"
 *   2. the author of the comment replied to → "replied to your comment"
 *   3. everyone else who commented earlier → "also commented on a post you commented on"
 * The commenter themselves never gets an email.
 */
export function commentTargets(
  event: Pick<CommentPostedEvent, 'postOwnerId' | 'parentCommentAuthorId' | 'actorId'>,
  earlierCommenterIds: number[],
): ActivityTarget[] {
  const targets = new Map<number, ActivityEmailType>();
  const add = (userId: number | null, type: ActivityEmailType) => {
    if (userId == null) return;
    const id = Number(userId);
    if (id === Number(event.actorId) || targets.has(id)) return;
    targets.set(id, type);
  };

  add(event.postOwnerId, ActivityEmailType.COMMENT);
  add(event.parentCommentAuthorId, ActivityEmailType.REPLY);
  for (const id of earlierCommenterIds) add(id, ActivityEmailType.THREAD_COMMENT);

  return [...targets].map(([userId, type]) => ({ userId, type }));
}
