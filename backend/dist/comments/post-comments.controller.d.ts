import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { CommentsService } from './comments.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
export declare class PostCommentsController {
    private readonly comments;
    constructor(comments: CommentsService);
    create(postId: number, user: AuthenticatedUser, dto: CreateCommentDto): Promise<import("./comment.mapper.js").CommentResponse>;
    list(postId: number, user: AuthenticatedUser): Promise<import("./comment.mapper.js").CommentResponse[]>;
}
