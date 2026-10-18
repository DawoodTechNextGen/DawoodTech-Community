import { type Relation } from 'typeorm';
import { Post } from './post.entity.js';
export declare class PostTag {
    postId: number;
    post: Relation<Post>;
    tag: string;
    createdAt: Date;
}
