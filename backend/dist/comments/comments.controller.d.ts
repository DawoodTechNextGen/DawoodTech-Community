import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { CommentsService } from './comments.service.js';
export declare class CommentsController {
    private readonly comments;
    constructor(comments: CommentsService);
    remove(id: string, user: AuthenticatedUser): Promise<void>;
}
