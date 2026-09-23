import { ActivityEmailType } from '../database/entities/activity-email-queue.entity.js';
import type { CommentPostedEvent } from '../notifications/notification.events.js';
export interface ActivityTarget {
    userId: number;
    type: ActivityEmailType;
}
export declare function commentTargets(event: Pick<CommentPostedEvent, 'postOwnerId' | 'parentCommentAuthorId' | 'actorId'>, earlierCommenterIds: number[]): ActivityTarget[];
