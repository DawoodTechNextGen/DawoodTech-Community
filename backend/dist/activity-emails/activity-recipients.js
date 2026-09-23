import { ActivityEmailType } from '../database/entities/activity-email-queue.entity.js';
export function commentTargets(event, earlierCommenterIds) {
    const targets = new Map();
    const add = (userId, type) => {
        if (userId == null)
            return;
        const id = Number(userId);
        if (id === Number(event.actorId) || targets.has(id))
            return;
        targets.set(id, type);
    };
    add(event.postOwnerId, ActivityEmailType.COMMENT);
    add(event.parentCommentAuthorId, ActivityEmailType.REPLY);
    for (const id of earlierCommenterIds)
        add(id, ActivityEmailType.THREAD_COMMENT);
    return [...targets].map(([userId, type]) => ({ userId, type }));
}
//# sourceMappingURL=activity-recipients.js.map