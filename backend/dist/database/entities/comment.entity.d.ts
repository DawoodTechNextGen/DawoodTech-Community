import { type Relation } from 'typeorm';
import { Post } from './post.entity.js';
import { User } from './user.entity.js';
export declare class Comment {
    id: number;
    postId: number;
    post: Relation<Post>;
    userId: number;
    author: Relation<User>;
    content: string;
    parentId: number | null;
    parent: Relation<Comment> | null;
    createdAt: Date;
}
