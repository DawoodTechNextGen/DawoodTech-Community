import { DataSource } from 'typeorm';
import { PromptsService } from '../prompts/prompts.service.js';
import { type PublicUser } from '../users/user.mapper.js';
export interface LeaderboardEntry {
    rank: number;
    user: PublicUser;
    points: number;
    posts: number;
    comments: number;
    reactions: number;
}
export interface Badge {
    key: string;
    emoji: string;
    label: string;
    description: string;
    earned: boolean;
}
export declare class CommunityService {
    private readonly db;
    private readonly prompts;
    constructor(db: DataSource, prompts: PromptsService);
    leaderboard(viewerId: number, days?: number): Promise<{
        days: number;
        top: LeaderboardEntry[];
        me: LeaderboardEntry | null;
    }>;
    adminStats(days?: number): Promise<{
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
    badges(userId: number): Promise<Badge[]>;
}
