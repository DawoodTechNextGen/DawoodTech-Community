export type UserRole = "intern" | "supervisor" | "admin";

// Backend bigint columns serialize as strings (see backend/src/posts/post.mapper.ts),
// so every id here is a string even though it's numeric-looking.
export interface PublicUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  bio: string | null;
  avatarUrl: string | null;
  role: UserRole;
}

export type AccountStatus = "active" | "disabled";

export interface AdminUser extends PublicUser {
  status: AccountStatus;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: PublicUser;
}

export type PostStatus = "pending" | "approved" | "rejected";

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  content: string;
  status: PostStatus;
  createdAt: string;
  mediaUrls: string[];
  isOwner: boolean;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}

export interface PaginatedPosts {
  items: Post[];
  nextCursor: string | null;
}

export interface Comment {
  id: string;
  postId: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  content: string;
  createdAt: string;
  isOwner: boolean;
}

export type NotificationType =
  | "comment"
  | "reply"
  | "follow"
  | "like"
  | "post_approved"
  | "post_rejected";

export interface Notification {
  id: string;
  type: NotificationType;
  actorId: string;
  actorName: string;
  actorAvatarUrl: string | null;
  postId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedNotifications {
  items: Notification[];
  nextCursor: string | null;
}

export interface DigestStats {
  id: number;
  /** Local calendar day, "YYYY-MM-DD". */
  day: string;
  postCount: number;
  queued: number;
  sent: number;
  failed: number;
  skipped: number;
}

export interface PostEmailStatsResponse {
  mode: "live" | "test" | "dry_run";
  digestHour: number;
  timeZone: string;
  pendingPosts: { postId: number; title: string }[];
  legacyQueued: number;
  digests: DigestStats[];
}
