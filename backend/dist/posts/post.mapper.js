export function toPostResponse(post, viewerId) {
    return {
        id: post.id,
        authorId: post.userId,
        authorName: post.author?.fullName ?? '',
        authorAvatarUrl: post.author?.avatarUrl ?? null,
        content: post.content,
        status: post.status,
        createdAt: post.createdAt.toISOString(),
        mediaUrls: (post.media ?? [])
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((m) => m.url),
        isOwner: post.userId === viewerId,
        likeCount: 0,
        commentCount: 0,
        likedByMe: false,
    };
}
//# sourceMappingURL=post.mapper.js.map