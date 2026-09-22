export const NotificationEvents = {
  CommentCreated: 'comment.created',
  ReplyCreated: 'reply.created',
  FollowCreated: 'follow.created',
  LikeCreated: 'like.created',
  PostApproved: 'post.approved',
  PostRejected: 'post.rejected',
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
