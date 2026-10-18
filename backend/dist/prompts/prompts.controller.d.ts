import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { PromptsService } from './prompts.service.js';
export declare class PromptsController {
    private readonly prompts;
    constructor(prompts: PromptsService);
    today(user: AuthenticatedUser): Promise<import("./prompts.service.js").TodayPrompt>;
}
