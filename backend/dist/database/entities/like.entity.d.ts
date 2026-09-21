import { type Relation } from 'typeorm';
import { Post } from './post.entity.js';
import { User } from './user.entity.js';
export declare class Like {
    postId: number;
    post: Relation<Post>;
    userId: number;
    user: Relation<User>;
    createdAt: Date;
}
