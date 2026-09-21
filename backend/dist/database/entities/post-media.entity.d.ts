import { type Relation } from 'typeorm';
import { Post } from './post.entity.js';
export declare class PostMedia {
    id: number;
    postId: number;
    post: Relation<Post>;
    url: string;
    mediaType: 'image';
    sortOrder: number;
    createdAt: Date;
}
