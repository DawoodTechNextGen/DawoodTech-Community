import { type Relation } from 'typeorm';
import { Post } from './post.entity.js';
import { User } from './user.entity.js';
export declare enum Reaction {
    LIKE = "like",
    CLAP = "clap",
    CELEBRATE = "celebrate",
    INSIGHTFUL = "insightful",
    FIRE = "fire"
}
export declare class Like {
    postId: number;
    post: Relation<Post>;
    userId: number;
    user: Relation<User>;
    reaction: Reaction;
    createdAt: Date;
}
