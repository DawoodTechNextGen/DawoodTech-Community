export declare const NotificationEvents: {
    readonly CommentCreated: "comment.created";
    readonly ReplyCreated: "reply.created";
    readonly FollowCreated: "follow.created";
    readonly LikeCreated: "like.created";
    readonly PostApproved: "post.approved";
    readonly PostRejected: "post.rejected";
    readonly CommentPosted: "comment.posted";
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
export interface CommentPostedEvent {
    postId: number;
    commentId: number;
    postOwnerId: number;
    parentCommentAuthorId: number | null;
    actorId: number;
}
