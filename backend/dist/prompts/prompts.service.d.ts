import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Comment } from '../database/entities/comment.entity.js';
import { Post } from '../database/entities/post.entity.js';
export interface TodayPrompt {
    day: string;
    prompt: string;
    answered: boolean;
    answerCount: number;
    streak: number;
    activeToday: boolean;
}
export declare class PromptsService {
    private readonly posts;
    private readonly comments;
    private readonly config;
    constructor(posts: Repository<Post>, comments: Repository<Comment>, config: ConfigService);
    private get timeZone();
    today(userId: number): Promise<TodayPrompt>;
    currentStreak(userId: number): Promise<number>;
    private streak;
}
