import { tokenStorage } from "./token-storage";
import type {
  AccountStatus,
  AdminUser,
  AdminStats,
  AuthResponse,
  AuthTokens,
  Badge,
  Leaderboard,
  Comment,
  PaginatedNotifications,
  PaginatedPosts,
  Post,
  PublicUser,
  Reaction,
  TodayPrompt,
  UserRole,
} from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const tokens = tokenStorage.get();
  if (!tokens) return null;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    if (!res.ok) throw new Error("refresh failed");
    const data = (await res.json()) as AuthTokens;
    tokenStorage.save(data);
    return data.accessToken;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

/** Serializes concurrent refresh attempts into a single in-flight request,
 *  so parallel 401s don't each fire their own /auth/refresh call. Also used
 *  by the live-notifications socket when its token is rejected. */
export function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= doRefresh().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (auth) {
      const tokens = tokenStorage.get();
      if (tokens) headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res = await doFetch();
  if (res.status === 401 && auth) {
    const newToken = await refreshAccessToken();
    if (newToken) res = await doFetch();
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const rawMessage = (data as { message?: string | string[] } | null)?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(", ")
      : (rawMessage ?? res.statusText);
    throw new ApiError(res.status, message);
  }
  return data as T;
}

async function uploadImage(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);

  const doFetch = async () => {
    const headers: Record<string, string> = {};
    const tokens = tokenStorage.get();
    if (tokens) headers.Authorization = `Bearer ${tokens.accessToken}`;
    return fetch(`${API_URL}/uploads/image`, { method: "POST", headers, body: form });
  };

  let res = await doFetch();
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) res = await doFetch();
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? res.statusText);
  }
  return data as { url: string };
}

export interface SignupInput {
  email: string;
  username: string;
  fullName: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface OnboardingProgress {
  hasAvatar: boolean;
  hasBio: boolean;
  followingCount: number;
  postCount: number;
}

export interface CreatePostInput {
  content: string;
  mediaUrls?: string[];
  /** Answering today's daily question. */
  answersPrompt?: boolean;
  /** Asking the community a question. */
  isQuestion?: boolean;
}

export interface UpdateProfileInput {
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
}

export const api = {
  signup: (dto: SignupInput) =>
    request<{ user: PublicUser }>("/auth/signup", { method: "POST", body: dto, auth: false }),
  login: (dto: LoginInput) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: dto, auth: false }),
  me: () => request<PublicUser>("/auth/me"),
  async logout() {
    const tokens = tokenStorage.get();
    if (tokens) {
      // Lazy import: push.ts imports this module.
      await import("./push").then((m) => m.forgetPushOnSignOut()).catch(() => {});
      await request("/auth/logout", {
        method: "POST",
        body: { refreshToken: tokens.refreshToken },
        auth: false,
      }).catch(() => {});
    }
    tokenStorage.clear();
  },

  verifyEmail: (token: string) =>
    request<{ success: true }>("/auth/verify-email", { method: "POST", body: { token }, auth: false }),
  resendVerification: (email: string) =>
    request<{ success: true }>("/auth/resend-verification", {
      method: "POST",
      body: { email },
      auth: false,
    }),
  forgotPassword: (email: string) =>
    request<{ success: true }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
      auth: false,
    }),
  resetPassword: (token: string, newPassword: string) =>
    request<{ success: true }>("/auth/reset-password", {
      method: "POST",
      body: { token, newPassword },
      auth: false,
    }),

  uploadImage,

  getFeed: (cursor?: string) =>
    request<PaginatedPosts>(`/posts/feed${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`),
  getExplore: (cursor?: string) =>
    request<PaginatedPosts>(
      `/posts/explore${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
    ),
  getQuestions: (cursor?: string) =>
    request<PaginatedPosts>(
      `/posts/questions${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
    ),
  getTagPosts: (tag: string, cursor?: string) =>
    request<PaginatedPosts>(
      `/posts/tags/${encodeURIComponent(tag)}${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
    ),
  getTrendingTags: () => request<{ tag: string; count: number }[]>("/posts/tags/trending"),
  searchPosts: (query: string) => request<Post[]>(`/posts/search?q=${encodeURIComponent(query)}`),
  acceptAnswer: (commentId: string) =>
    request<Comment>(`/comments/${commentId}/accept`, { method: "PATCH" }),
  getPost: (id: string) => request<Post>(`/posts/${id}`),
  createPost: (dto: CreatePostInput) =>
    request<Post>("/posts", { method: "POST", body: dto }),
  updatePost: (id: string, dto: CreatePostInput) =>
    request<Post>(`/posts/${id}`, { method: "PATCH", body: dto }),
  deletePost: (id: string) => request<void>(`/posts/${id}`, { method: "DELETE" }),

  like: (postId: string, reaction?: Reaction) =>
    request<{ success: true }>(`/posts/${postId}/like`, {
      method: "POST",
      body: reaction ? { reaction } : undefined,
    }),
  unlike: (postId: string) => request<void>(`/posts/${postId}/like`, { method: "DELETE" }),

  getComments: (postId: string) => request<Comment[]>(`/posts/${postId}/comments`),
  createComment: (postId: string, content: string, parentId?: string) =>
    request<Comment>(`/posts/${postId}/comments`, {
      method: "POST",
      body: parentId ? { content, parentId: Number(parentId) } : { content },
    }),
  deleteComment: (id: string) => request<void>(`/comments/${id}`, { method: "DELETE" }),

  getNotifications: (cursor?: string) =>
    request<PaginatedNotifications>(
      `/notifications${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
    ),
  getUnreadCount: () => request<{ count: number }>("/notifications/unread-count"),
  markNotificationRead: (id: string) =>
    request<{ success: true }>(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () =>
    request<{ success: true }>("/notifications/read-all", { method: "PATCH" }),

  getPushPublicKey: () => request<{ publicKey: string | null }>("/push/public-key"),
  subscribePush: (subscription: PushSubscriptionJSON) =>
    request<void>("/push/subscribe", {
      method: "POST",
      body: { endpoint: subscription.endpoint, keys: subscription.keys },
    }),
  unsubscribePush: (endpoint: string) =>
    request<void>("/push/unsubscribe", { method: "POST", body: { endpoint } }),

  getReviewStats: () =>
    request<{ pending: number; avgWaitMinutes: number | null; reviewed30d: number }>(
      "/admin/posts/stats",
    ),
  getPinnedPosts: () => request<Post[]>("/posts/pinned"),
  pinPost: (id: string, pinned: boolean, notifyAll = false) =>
    request<Post>(`/admin/posts/${id}/pin`, { method: "PATCH", body: { pinned, notifyAll } }),
  getAdminStats: () => request<AdminStats>("/admin/stats"),
  getPendingPosts: () => request<Post[]>("/admin/posts/pending"),
  approvePost: (id: string) => request<Post>(`/admin/posts/${id}/approve`, { method: "PATCH" }),
  rejectPost: (id: string) => request<Post>(`/admin/posts/${id}/reject`, { method: "PATCH" }),

  getAdminUsers: () => request<AdminUser[]>("/admin/users"),
  setUserStatus: (id: string, status: AccountStatus) =>
    request<AdminUser>(`/admin/users/${id}/status`, { method: "PATCH", body: { status } }),
  setUserRole: (id: string, role: UserRole) =>
    request<AdminUser>(`/admin/users/${id}/role`, { method: "PATCH", body: { role } }),

  getUser: (id: string) => request<PublicUser>(`/users/${id}`),
  getUserByUsername: (username: string) =>
    request<PublicUser>(`/users/by-username/${encodeURIComponent(username)}`),
  searchUsers: (query: string) =>
    request<PublicUser[]>(`/users?search=${encodeURIComponent(query)}`),
  getUserPosts: (id: string) => request<Post[]>(`/users/${id}/posts`),
  updateMe: (dto: UpdateProfileInput) =>
    request<PublicUser>("/users/me", { method: "PATCH", body: dto }),

  followUser: (id: string) =>
    request<{ success: true }>(`/users/${id}/follow`, { method: "POST" }),
  unfollowUser: (id: string) => request<void>(`/users/${id}/follow`, { method: "DELETE" }),
  getFollowStatus: (id: string) =>
    request<{ isFollowing: boolean }>(`/users/${id}/follow-status`),
  getFollowers: (id: string) => request<PublicUser[]>(`/users/${id}/followers`),
  getFollowing: (id: string) => request<PublicUser[]>(`/users/${id}/following`),
  getTodayPrompt: () => request<TodayPrompt>("/prompts/today"),
  getLeaderboard: () => request<Leaderboard>("/community/leaderboard"),
  getBadges: (userId: string) => request<Badge[]>(`/users/${userId}/badges`),
  getOnboardingProgress: () => request<OnboardingProgress>("/users/me/progress"),
  getSuggestedUsers: () => request<PublicUser[]>("/users/suggestions"),
};
