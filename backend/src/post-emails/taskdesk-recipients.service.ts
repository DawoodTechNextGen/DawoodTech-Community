import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isEmail } from 'class-validator';
import mysql, { type Pool, type RowDataPacket } from 'mysql2/promise';
import { normalizeEmail } from './email-worker-utils.js';

export interface Recipient {
  email: string;
  name: string | null;
}

// TaskDesk user_role values that count as interns: 2 = intern, 6 = candidate.
const INTERN_ROLES = [2, 6];
// TaskDesk users.status 1 = active; registrations.status 'hire' = hired.
// Finished interns are the ones with an approved certificate
// (certificate.approve_status = 1). Accounts stay active after an internship
// ends, so "active" alone would mean every intern ever — hence the recency
// window (TASKDESK_RECENT_MONTHS).
const ACTIVE_USER_STATUS = 1;
const HIRED_REGISTRATION_STATUS = 'hire';

/** Reads intern emails out of TaskDesk's database. Strictly read-only —
 *  only SELECTs are ever issued, and a SELECT-only MySQL user is recommended. */
@Injectable()
export class TaskdeskRecipientsService implements OnModuleDestroy {
  private readonly logger = new Logger(TaskdeskRecipientsService.name);
  private pool: Pool | null = null;

  constructor(private readonly config: ConfigService) {}

  private getPool(): Pool {
    this.pool ??= mysql.createPool({
      host: this.config.get<string>('taskdeskDb.host'),
      port: this.config.get<number>('taskdeskDb.port'),
      user: this.config.get<string>('taskdeskDb.user'),
      password: this.config.get<string>('taskdeskDb.password'),
      database: this.config.get<string>('taskdeskDb.database'),
      connectionLimit: 2,
    });
    return this.pool;
  }

  /** Recent TaskDesk interns, de-duplicated by trimmed, lowercased email:
   *  active intern/candidate accounts that joined in the last N months,
   *  interns whose certificate was approved in the last N months, and
   *  registrations hired in the last N months (N = TASKDESK_RECENT_MONTHS).
   *  New, rejected and other registrations are left out: many of those
   *  addresses bounce, and cPanel blocks all of the domain's mail for an hour
   *  after a handful of bounces. */
  async fetchRecipients(): Promise<Recipient[]> {
    const months = this.config.get<number>('taskdeskDb.recentMonths') ?? 3;
    const [rows] = await this.getPool().query<RowDataPacket[]>(
      `SELECT name, email FROM registrations
       WHERE status = ? AND COALESCE(updated_at, created_at) >= NOW() - INTERVAL ? MONTH
       UNION ALL
       SELECT name, email FROM users
       WHERE user_role IN (?) AND status = ? AND created_at >= NOW() - INTERVAL ? MONTH
       UNION ALL
       SELECT u.name, u.email FROM users u
       JOIN certificate c ON c.intern_id = u.id
       WHERE u.user_role IN (?) AND c.approve_status = 1
         AND c.created_at >= NOW() - INTERVAL ? MONTH`,
      [
        HIRED_REGISTRATION_STATUS,
        months,
        INTERN_ROLES,
        ACTIVE_USER_STATUS,
        months,
        INTERN_ROLES,
        months,
      ],
    );
    return dedupeRecipients(rows as { name: string | null; email: string | null }[]);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end().catch((err) => this.logger.warn(`Closing pool: ${err}`));
  }
}

export function dedupeRecipients(
  rows: { name: string | null; email: string | null }[],
): Recipient[] {
  const byEmail = new Map<string, Recipient>();
  for (const row of rows) {
    const email = normalizeEmail(row.email ?? '');
    if (!email || !isEmail(email)) continue;
    const name = row.name?.trim() || null;
    const existing = byEmail.get(email);
    if (!existing) byEmail.set(email, { email, name });
    else if (!existing.name && name) existing.name = name;
  }
  return [...byEmail.values()];
}
