import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PromptsService } from '../prompts/prompts.service.js';
import { toPublicUser, type PublicUser } from '../users/user.mapper.js';
import type { User } from '../database/entities/user.entity.js';

/** Points for activity: sharing is worth most, then helping, then being appreciated. */
const POINTS = { post: 5, comment: 2, reaction: 1 } as const;
const LEADERBOARD_SIZE = 10;

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

type Row = Record<string, string | number | null>;

@Injectable()
export class CommunityService {
  constructor(
    @InjectDataSource() private readonly db: DataSource,
    private readonly prompts: PromptsService,
  ) {}

  /** Top members by points over the last `days` days, plus the viewer's own
   *  standing (even when outside the top 10). */
  async leaderboard(
    viewerId: number,
    days = 7,
  ): Promise<{ days: number; top: LeaderboardEntry[]; me: LeaderboardEntry | null }> {
    const since = new Date(Date.now() - days * 86_400_000);
    // Auto-shared milestone posts and reactions to your own posts don't count.
    const rows = (await this.db.query(
      `SELECT u.id, u.username, u.full_name, u.bio, u.avatar_url, u.role, s.posts, s.comments, s.reactions,
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
       ORDER BY points DESC, s.posts DESC, u.id ASC`,
      [POINTS.post, POINTS.comment, POINTS.reaction, since, since, since],
    )) as Row[];

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

  /**
   * Community health for admins. "Active" means did something visible (posted,
   * commented or reacted) — the app doesn't track page views.
   */
  async adminStats(days = 14) {
    const since = new Date(Date.now() - days * 86_400_000);
    const activity = `
      SELECT user_id, created_at FROM posts WHERE milestone IS NULL
      UNION ALL SELECT user_id, created_at FROM comments
      UNION ALL SELECT user_id, created_at FROM likes`;
    const [daily, [active], [retention]] = (await Promise.all([
      this.db.query(
        `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') day,
                COUNT(DISTINCT user_id) activeMembers,
                SUM(kind = 'post') posts,
                SUM(kind = 'comment') comments
         FROM (
           SELECT user_id, created_at, 'post' kind FROM posts WHERE milestone IS NULL
           UNION ALL SELECT user_id, created_at, 'comment' FROM comments
           UNION ALL SELECT user_id, created_at, 'reaction' FROM likes
         ) a
         WHERE created_at >= ?
         GROUP BY day ORDER BY day`,
        [since],
      ),
      this.db.query(
        `SELECT
           COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL 1 DAY THEN user_id END) daily,
           COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL 7 DAY THEN user_id END) weekly,
           COUNT(DISTINCT user_id) monthly
         FROM (${activity}) a WHERE created_at >= NOW() - INTERVAL 30 DAY`,
      ),
      // Of members who joined 8–37 days ago, how many were active again
      // a week or more after signing up.
      this.db.query(
        `SELECT COUNT(*) joined,
                SUM(EXISTS (SELECT 1 FROM (${activity}) a
                            WHERE a.user_id = u.id AND a.created_at >= u.created_at + INTERVAL 7 DAY)) returned
         FROM users u
         WHERE u.is_email_verified = 1
           AND u.created_at BETWEEN NOW() - INTERVAL 37 DAY AND NOW() - INTERVAL 8 DAY`,
      ),
    ])) as [Row[], Row[], Row[]];

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

  /** Every badge, with whether this member has earned it (all-time). */
  async badges(userId: number): Promise<Badge[]> {
    const [[stats], streak] = await Promise.all([
      this.db.query(
        `SELECT
           (SELECT COUNT(*) FROM posts WHERE user_id = ? AND status = 'approved' AND milestone IS NULL) posts,
           (SELECT COUNT(*) FROM posts WHERE user_id = ? AND status = 'approved' AND prompt_day IS NOT NULL) answers,
           (SELECT COUNT(*) FROM comments WHERE user_id = ?) comments,
           (SELECT COUNT(*) FROM likes l JOIN posts p ON p.id = l.post_id
              WHERE p.user_id = ? AND l.user_id <> p.user_id) reactions`,
        [userId, userId, userId, userId],
      ) as Promise<Row[]>,
      this.prompts.currentStreak(userId),
    ]);
    const n = (key: string) => Number(stats?.[key] ?? 0);

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
}

/** Raw users row (snake_case) → the fields toPublicUser reads. */
function rowToUser(r: Row): User {
  return {
    id: r.id,
    username: r.username,
    fullName: r.full_name,
    bio: r.bio,
    avatarUrl: r.avatar_url,
    role: r.role,
  } as unknown as User;
}
