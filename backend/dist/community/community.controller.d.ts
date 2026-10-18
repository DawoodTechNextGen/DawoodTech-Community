import type { AuthenticatedUser } from '../auth/jwt.strategy.js';
import { CommunityService } from './community.service.js';
export declare class CommunityController {
    private readonly community;
    constructor(community: CommunityService);
    leaderboard(user: AuthenticatedUser): Promise<{
        days: number;
        top: import("./community.service.js").LeaderboardEntry[];
        me: import("./community.service.js").LeaderboardEntry | null;
    }>;
    adminStats(): Promise<{
        activeMembers: {
            today: number;
            week: number;
            month: number;
        };
        retention: {
            joined: number;
            returned: number;
        };
        daily: {
            day: string;
            activeMembers: number;
            posts: number;
            comments: number;
        }[];
    }>;
    badges(id: number): Promise<import("./community.service.js").Badge[]>;
}
