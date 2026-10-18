import type { User } from '../database/entities/user.entity.js';
export interface PublicUser {
    id: number;
    username: string;
    fullName: string;
    bio: string | null;
    avatarUrl: string | null;
    role: string;
}
export declare function toPublicUser(user: User): PublicUser;
export interface SelfUser extends PublicUser {
    email: string;
}
export declare function toSelfUser(user: User): SelfUser;
export interface AdminUserResponse extends SelfUser {
    status: string;
    createdAt: string;
}
export declare function toAdminUserResponse(user: User): AdminUserResponse;
