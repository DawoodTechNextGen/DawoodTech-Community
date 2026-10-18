export declare const NotificationEvents: {
    readonly CommentCreated: "comment.created";
    readonly ReplyCreated: "reply.created";
    readonly FollowCreated: "follow.created";
    readonly LikeCreated: "like.created";
    readonly PostApproved: "post.approved";
    readonly PostRejected: "post.rejected";
    readonly PendingPostsChanged: "posts.pending-changed";
    readonly MentionsPublished: "mentions.published";
    readonly AnnouncementPinned: "announcement.pinned";
    readonly AnswerAccepted: "answer.accepted";
    readonly PostSubmitted: "post.submitted";
    readonly UserVerified: "user.verified";
    readonly UserAccessChanged: "user.access-changed";
};
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
