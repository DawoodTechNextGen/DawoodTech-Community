export const PostEmailEvents = {
  /** An admin approved a post and asked for interns to be emailed about it. */
  PostPublished: 'post.published',
} as const;

export interface PostPublishedEvent {
  postId: number;
}
