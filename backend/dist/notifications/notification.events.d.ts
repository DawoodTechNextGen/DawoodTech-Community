export declare const NotificationEvents: {
    readonly CommentCreated: "comment.created";
    readonly FollowCreated: "follow.created";
    readonly LikeCreated: "like.created";
    readonly PostApproved: "post.approved";
    readonly PostRejected: "post.rejected";
};
export interface CommentCreatedEvent {
    postId: number;
    postOwnerId: number;
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
