export const NotificationEvents = {
  CommentCreated: 'comment.created',
  ReplyCreated: 'reply.created',
  FollowCreated: 'follow.created',
  LikeCreated: 'like.created',
  PostApproved: 'post.approved',
  PostRejected: 'post.rejected',
  /** A post entered or left the moderation queue — admins' live badge. */
  PendingPostsChanged: 'posts.pending-changed',
  /** Published text that may @mention people (an approved post, or a comment). */
  MentionsPublished: 'mentions.published',
  /** An admin pinned a post and asked for everyone to be told. */
  AnnouncementPinned: 'announcement.pinned',
  /** A question's author accepted someone's comment as the answer. */
  AnswerAccepted: 'answer.accepted',
  /** A post went into the review queue — admins get a push alert. */
  PostSubmitted: 'post.submitted',
  /** A member confirmed their email — their account is now usable. */
  UserVerified: 'user.verified',
  /** A member was blocked/unblocked or their role changed. */
  UserAccessChanged: 'user.access-changed',
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

export interface UserAccessChangedEvent {
  userId: number;
}

export interface PostSubmittedEvent {
  postId: number;
  authorId: number;
}

export interface UserVerifiedEvent {
  userId: number;
}

export interface MentionsPublishedEvent {
  postId: number;
  actorId: number;
  text: string;
  /** Already notified about this (e.g. the post owner got a "comment"). */
  skipUserIds: number[];
}

export interface AnnouncementPinnedEvent {
  postId: number;
  adminId: number;
}

export interface AnswerAcceptedEvent {
  postId: number;
  answerAuthorId: number;
  actorId: number;
}
