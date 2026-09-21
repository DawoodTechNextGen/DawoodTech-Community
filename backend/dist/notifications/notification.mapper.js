export function toNotificationResponse(n) {
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
//# sourceMappingURL=notification.mapper.js.map