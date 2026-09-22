import type { User } from '../database/entities/user.entity.js';
export interface PublicUser {
    id: number;
    email: string;
    username: string;
    fullName: string;
    bio: string | null;
    avatarUrl: string | null;
    role: string;
}
export declare function toPublicUser(user: User): PublicUser;
export interface AdminUserResponse extends PublicUser {
    status: string;
    createdAt: string;
}
export declare function toAdminUserResponse(user: User): AdminUserResponse;
