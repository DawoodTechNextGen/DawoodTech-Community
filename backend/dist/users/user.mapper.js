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
//# sourceMappingURL=user.mapper.js.map