import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Comment } from '../database/entities/comment.entity.js';
import { Post, PostStatus } from '../database/entities/post.entity.js';
import { promptForDay } from './daily-prompts.js';
import { localDay, previousDay } from './local-day.js';

/** Streaks only look this far back; longer ones show as this many days. */
const STREAK_WINDOW_DAYS = 120;

export interface TodayPrompt {
  day: string;
  prompt: string;
  /** The viewer already answered today's question. */
  answered: boolean;
  /** Published answers so far today, across the community. */
  answerCount: number;
  /** Consecutive local days on which the viewer posted or commented. */
  streak: number;
  /** Whether today already counts toward the streak. */
  activeToday: boolean;
}

@Injectable()
export class PromptsService {
  constructor(
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
    private readonly config: ConfigService,
  ) {}

  private get timeZone(): string {
    return this.config.get<string>('timeZone') ?? 'Asia/Karachi';
  }

  async today(userId: number): Promise<TodayPrompt> {
    const day = localDay(new Date(), this.timeZone);
    const [answered, answerCount, { streak, activeToday }] = await Promise.all([
      this.posts.existsBy({ userId, promptDay: day }),
      this.posts.countBy({ promptDay: day, status: PostStatus.APPROVED }),
      this.streak(userId, day),
    ]);
    return {
      day,
      prompt: promptForDay(day),
      answered,
      answerCount,
      streak,
      activeToday,
    };
  }

  /** The member's current streak (consecutive local days with a post or comment). */
  async currentStreak(userId: number): Promise<number> {
    return (await this.streak(userId, localDay(new Date(), this.timeZone))).streak;
  }

  /** Counts back from today — or from yesterday, so a streak isn't "lost"
   *  in the morning before the member has had a chance to post. */
  private async streak(
    userId: number,
    today: string,
  ): Promise<{ streak: number; activeToday: boolean }> {
    const since = new Date(Date.now() - STREAK_WINDOW_DAYS * 86_400_000);
    const [posts, comments] = await Promise.all([
      this.posts.find({
        select: { createdAt: true },
        where: { userId, createdAt: MoreThan(since) },
      }),
      this.comments.find({
        select: { createdAt: true },
        where: { userId, createdAt: MoreThan(since) },
      }),
    ]);
    const days = new Set([...posts, ...comments].map((r) => localDay(r.createdAt, this.timeZone)));

    const activeToday = days.has(today);
    let day = activeToday ? today : previousDay(today);
    let streak = 0;
    while (days.has(day)) {
      streak++;
      day = previousDay(day);
    }
    return { streak, activeToday };
  }
}
