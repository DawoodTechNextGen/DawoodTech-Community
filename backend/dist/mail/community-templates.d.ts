export interface RenderedEmail {
    subject: string;
    html: string;
    text: string;
}
interface CommonEmailInput {
    recipientName: string | null;
    recipientEmail: string;
    communityUrl: string;
    logoUrl: string;
    date: Date;
}
export interface NewPostEmailInput extends CommonEmailInput {
    title: string;
    authorName: string;
    authorAvatarUrl: string | null;
    excerpt: string;
    imageUrl: string | null;
    postUrl: string;
}
export declare function newPostTemplate(input: NewPostEmailInput): RenderedEmail;
export interface ActivityEmailInput extends CommonEmailInput {
    heading: string;
    actorName: string;
    actorAvatarUrl: string | null;
    action: string;
    commentText: string | null;
    postTitle: string;
    postLabel: string;
    postImageUrl: string | null;
    postUrl: string;
    buttonLabel: string;
}
export declare function activityTemplate(input: ActivityEmailInput): RenderedEmail;
export {};
