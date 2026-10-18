import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { CommentsService } from './comments.service.js';
export declare class CommentsController {
    private readonly comments;
    constructor(comments: CommentsService);
    accept(id: number, user: AuthenticatedUser): Promise<import("./comment.mapper.js").CommentResponse>;
    remove(id: number, user: AuthenticatedUser): Promise<void>;
}
