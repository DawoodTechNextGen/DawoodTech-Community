import { sameId } from '../common/same-id.js';
export function toPostResponse(post, viewerId) {
    return {
        id: post.id,
        authorId: post.userId,
        authorName: post.author?.fullName ?? '',
        authorAvatarUrl: post.author?.avatarUrl ?? null,
        content: post.content,
        status: post.status,
        createdAt: post.createdAt.toISOString(),
        mediaUrls: (post.media ?? []).sort((a, b) => a.sortOrder - b.sortOrder).map((m) => m.url),
        isOwner: sameId(post.userId, viewerId),
        likeCount: 0,
        commentCount: 0,
        likedByMe: false,
        reactions: {},
        myReaction: null,
        prompt: post.promptText ?? null,
        milestone: post.milestone ?? null,
        pinned: post.pinnedAt != null,
        isQuestion: !!post.isQuestion,
        answered: false,
    };
}
//# sourceMappingURL=post.mapper.js.map