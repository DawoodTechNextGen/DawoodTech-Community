import type { User } from '../database/entities/user.entity.js';

/** What any member may see about another member — no email address. */
export interface PublicUser {
  id: number;
  username: string;
  fullName: string;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    role: user.role,
  };
}

/** The signed-in member's own account, including their email. */
export interface SelfUser extends PublicUser {
  email: string;
}

export function toSelfUser(user: User): SelfUser {
  return { ...toPublicUser(user), email: user.email };
}

export interface AdminUserResponse extends SelfUser {
  status: string;
  createdAt: string;
}

export function toAdminUserResponse(user: User): AdminUserResponse {
  return {
    ...toSelfUser(user),
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  };
}
