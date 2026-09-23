export const NotificationEvents = {
  CommentCreated: 'comment.created',
  ReplyCreated: 'reply.created',
  FollowCreated: 'follow.created',
  LikeCreated: 'like.created',
  PostApproved: 'post.approved',
  PostRejected: 'post.rejected',
  /** Fired for every new comment (top-level or reply) — drives activity emails. */
  CommentPosted: 'comment.posted',
} as const;

export interface CommentCreatedEvent {
  postId: number;
  postOwnerId: number;
  actorId: number;
}

export interface ReplyCreatedEvent {
  postId: number;
  parentCommentAuthorId: number;
  actorId: number;
}

export interface FollowCreatedEvent {
  followingId: number;
  followerId: number;
}

export interface LikeCreatedEvent {
  postId: number;
  postOwnerId: number;
  actorId: number;
}

export interface PostReviewedEvent {
  postId: number;
  authorId: number;
  adminId: number;
}

export interface CommentPostedEvent {
  postId: number;
  commentId: number;
  postOwnerId: number;
  /** Author of the comment being replied to, or null for a top-level comment. */
  parentCommentAuthorId: number | null;
  actorId: number;
}
