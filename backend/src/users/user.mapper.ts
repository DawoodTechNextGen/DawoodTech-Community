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

export function toPublicUser(user: User): PublicUser {
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

export interface AdminUserResponse extends PublicUser {
  status: string;
  createdAt: string;
}

export function toAdminUserResponse(user: User): AdminUserResponse {
  return {
    ...toPublicUser(user),
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  };
}
