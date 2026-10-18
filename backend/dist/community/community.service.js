var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PromptsService } from '../prompts/prompts.service.js';
import { toPublicUser } from '../users/user.mapper.js';
const POINTS = { post: 5, comment: 2, reaction: 1 };
const LEADERBOARD_SIZE = 10;
let CommunityService = class CommunityService {
    db;
    prompts;
    constructor(db, prompts) {
        this.db = db;
        this.prompts = prompts;
    }
    async leaderboard(viewerId, days = 7) {
        const since = new Date(Date.now() - days * 86_400_000);
        const rows = (await this.db.query(`SELECT u.id, u.username, u.full_name, u.bio, u.avatar_url, u.role, s.posts, s.comments, s.reactions,
              s.posts * ? + s.comments * ? + s.reactions * ? AS points
       FROM (
         SELECT user_id, SUM(posts) posts, SUM(comments) comments, SUM(reactions) reactions
         FROM (
           SELECT user_id, COUNT(*) posts, 0 comments, 0 reactions FROM posts
             WHERE status = 'approved' AND milestone IS NULL AND created_at >= ? GROUP BY user_id
           UNION ALL
           SELECT user_id, 0, COUNT(*), 0 FROM comments WHERE created_at >= ? GROUP BY user_id
           UNION ALL
           SELECT p.user_id, 0, 0, COUNT(*) FROM likes l JOIN posts p ON p.id = l.post_id
             WHERE l.created_at >= ? AND l.user_id <> p.user_id GROUP BY p.user_id
         ) activity GROUP BY user_id
       ) s
       JOIN users u ON u.id = s.user_id AND u.status = 'active'
       ORDER BY points DESC, s.posts DESC, u.id ASC`, [POINTS.post, POINTS.comment, POINTS.reaction, since, since, since]));
        const entries = rows.map((r, i) => ({
            rank: i + 1,
            user: toPublicUser(rowToUser(r)),
            points: Number(r.points),
            posts: Number(r.posts),
            comments: Number(r.comments),
            reactions: Number(r.reactions),
        }));
        return {
            days,
            top: entries.slice(0, LEADERBOARD_SIZE),
            me: entries.find((e) => String(e.user.id) === String(viewerId)) ?? null,
        };
    }
    async adminStats(days = 14) {
        const since = new Date(Date.now() - days * 86_400_000);
        const activity = `
      SELECT user_id, created_at FROM posts WHERE milestone IS NULL
      UNION ALL SELECT user_id, created_at FROM comments
      UNION ALL SELECT user_id, created_at FROM likes`;
        const [daily, [active], [retention]] = (await Promise.all([
            this.db.query(`SELECT DATE_FORMAT(created_at, '%Y-%m-%d') day,
                COUNT(DISTINCT user_id) activeMembers,
                SUM(kind = 'post') posts,
                SUM(kind = 'comment') comments
         FROM (
           SELECT user_id, created_at, 'post' kind FROM posts WHERE milestone IS NULL
           UNION ALL SELECT user_id, created_at, 'comment' FROM comments
           UNION ALL SELECT user_id, created_at, 'reaction' FROM likes
         ) a
         WHERE created_at >= ?
         GROUP BY day ORDER BY day`, [since]),
            this.db.query(`SELECT
           COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL 1 DAY THEN user_id END) daily,
           COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL 7 DAY THEN user_id END) weekly,
           COUNT(DISTINCT user_id) monthly
         FROM (${activity}) a WHERE created_at >= NOW() - INTERVAL 30 DAY`),
            this.db.query(`SELECT COUNT(*) joined,
                SUM(EXISTS (SELECT 1 FROM (${activity}) a
                            WHERE a.user_id = u.id AND a.created_at >= u.created_at + INTERVAL 7 DAY)) returned
         FROM users u
         WHERE u.is_email_verified = 1
           AND u.created_at BETWEEN NOW() - INTERVAL 37 DAY AND NOW() - INTERVAL 8 DAY`),
        ]));
        const joined = Number(retention?.joined ?? 0);
        return {
            activeMembers: {
                today: Number(active?.daily ?? 0),
                week: Number(active?.weekly ?? 0),
                month: Number(active?.monthly ?? 0),
            },
            retention: {
                joined,
                returned: Number(retention?.returned ?? 0),
            },
            daily: daily.map((d) => ({
                day: String(d.day),
                activeMembers: Number(d.activeMembers),
                posts: Number(d.posts),
                comments: Number(d.comments),
            })),
        };
    }
    async badges(userId) {
        const [[stats], streak] = await Promise.all([
            this.db.query(`SELECT
           (SELECT COUNT(*) FROM posts WHERE user_id = ? AND status = 'approved' AND milestone IS NULL) posts,
           (SELECT COUNT(*) FROM posts WHERE user_id = ? AND status = 'approved' AND prompt_day IS NOT NULL) answers,
           (SELECT COUNT(*) FROM comments WHERE user_id = ?) comments,
           (SELECT COUNT(*) FROM likes l JOIN posts p ON p.id = l.post_id
              WHERE p.user_id = ? AND l.user_id <> p.user_id) reactions`, [userId, userId, userId, userId]),
            this.prompts.currentStreak(userId),
        ]);
        const n = (key) => Number(stats?.[key] ?? 0);
        return [
            {
                key: 'first-post',
                emoji: '✍️',
                label: 'First Post',
                description: 'Shared a first post',
                earned: n('posts') >= 1,
            },
            {
                key: 'storyteller',
                emoji: '📚',
                label: 'Storyteller',
                description: '10 posts shared',
                earned: n('posts') >= 10,
            },
            {
                key: 'helper',
                emoji: '🤝',
                label: 'Helper',
                description: '25 comments on others’ posts',
                earned: n('comments') >= 25,
            },
            {
                key: 'crowd-favourite',
                emoji: '⭐',
                label: 'Crowd Favourite',
                description: '50 reactions received',
                earned: n('reactions') >= 50,
            },
            {
                key: 'daily-thinker',
                emoji: '💭',
                label: 'Daily Thinker',
                description: 'Answered 5 daily questions',
                earned: n('answers') >= 5,
            },
            {
                key: 'on-fire',
                emoji: '🔥',
                label: 'On Fire',
                description: 'A 7-day streak',
                earned: streak >= 7,
            },
        ];
    }
};
CommunityService = __decorate([
    Injectable(),
    __param(0, InjectDataSource()),
    __metadata("design:paramtypes", [DataSource,
        PromptsService])
], CommunityService);
export { CommunityService };
function rowToUser(r) {
    return {
        id: r.id,
        username: r.username,
        fullName: r.full_name,
        bio: r.bio,
        avatarUrl: r.avatar_url,
        role: r.role,
    };
}
//# sourceMappingURL=community.service.js.map