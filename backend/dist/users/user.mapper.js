export function toPublicUser(user) {
    return {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        role: user.role,
    };
}
export function toSelfUser(user) {
    return { ...toPublicUser(user), email: user.email };
}
export function toAdminUserResponse(user) {
    return {
        ...toSelfUser(user),
        status: user.status,
        createdAt: user.createdAt.toISOString(),
    };
}
//# sourceMappingURL=user.mapper.js.map