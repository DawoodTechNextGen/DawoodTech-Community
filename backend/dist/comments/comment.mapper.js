import { sameId } from '../common/same-id.js';
export function toCommentResponse(comment, viewerId) {
    return {
        id: comment.id,
        postId: comment.postId,
        parentId: comment.parentId,
        authorId: comment.userId,
        authorName: comment.author?.fullName ?? '',
        authorAvatarUrl: comment.author?.avatarUrl ?? null,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        isOwner: sameId(comment.userId, viewerId),
        accepted: comment.acceptedAt != null,
    };
}
//# sourceMappingURL=comment.mapper.js.map