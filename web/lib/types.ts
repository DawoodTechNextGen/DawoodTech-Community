export type UserRole = "intern" | "supervisor" | "admin";

// Backend bigint columns serialize as strings (see backend/src/posts/post.mapper.ts),
// so every id here is a string even though it's numeric-looking.
export interface PublicUser {
  id: string;
  /** Only on your own account (/auth/me, login) and in the admin user list —
   *  other members' emails are never sent. */
  email?: string;
  username: string;
  fullName: string;
  bio: string | null;
  avatarUrl: string | null;
  role: UserRole;
}

export type AccountStatus = "active" | "disabled";

export interface AdminUser extends PublicUser {
  email: string;
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

export interface LeaderboardEntry {
  rank: number;
  user: PublicUser;
  points: number;
  posts: number;
  comments: number;
  reactions: number;
}

export interface Leaderboard {
  days: number;
  top: LeaderboardEntry[];
  me: LeaderboardEntry | null;
}

export interface Badge {
  key: string;
  emoji: string;
  label: string;
  description: string;
  earned: boolean;
}

export interface AdminStats {
  activeMembers: { today: number; week: number; month: number };
  retention: { joined: number; returned: number };
  daily: { day: string; activeMembers: number; posts: number; comments: number }[];
}

export type Reaction = "like" | "clap" | "celebrate" | "insightful" | "fire";

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
  /** Count per reaction; likeCount is their total. */
  reactions: Partial<Record<Reaction, number>>;
  myReaction: Reaction | null;
  /** The daily question this post answers, if any. */
  prompt: string | null;
  /** Set on celebration posts the app shares automatically. */
  milestone: "joined" | "internship_completed" | null;
  /** Pinned by an admin as an announcement. */
  pinned: boolean;
  /** Asked as a question… */
  isQuestion: boolean;
  /** …and its author accepted an answer. */
  answered: boolean;
}

export interface TodayPrompt {
  day: string;
  prompt: string;
  answered: boolean;
  answerCount: number;
  streak: number;
  activeToday: boolean;
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
  /** Accepted by the question's author as the answer. */
  accepted: boolean;
}

export type NotificationType =
  | "comment"
  | "reply"
  | "follow"
  | "like"
  | "post_approved"
  | "post_rejected"
  | "mention"
  | "announcement"
  | "answer_accepted";

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
