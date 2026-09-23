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
export interface DigestPost {
    title: string;
    authorName: string;
    authorAvatarUrl: string | null;
    excerpt: string;
    imageUrl: string | null;
    url: string;
}
export interface DigestEmailInput extends CommonEmailInput {
    posts: DigestPost[];
}
export declare function digestTemplate(input: DigestEmailInput): RenderedEmail;
export interface ActivityPostPreview {
    title: string;
    label: string;
    imageUrl: string | null;
    url: string;
}
export interface ActivityEmailInput extends CommonEmailInput {
    heading: string;
    actorName: string;
    actorAvatarUrl: string | null;
    action: string;
    commentText: string | null;
    post: ActivityPostPreview | null;
    buttonLabel: string;
    buttonUrl: string;
}
export declare function activityTemplate(input: ActivityEmailInput): RenderedEmail;
export {};
