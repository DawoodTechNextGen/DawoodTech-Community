export function toPublicUser(user) {
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        role: user.role,
    };
}
export function toAdminUserResponse(user) {
    return {
        ...toPublicUser(user),
        status: user.status,
        createdAt: user.createdAt.toISOString(),
    };
}
//# sourceMappingURL=user.mapper.js.map