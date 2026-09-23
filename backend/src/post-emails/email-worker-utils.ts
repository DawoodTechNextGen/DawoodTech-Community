import type { DataSource } from 'typeorm';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Runs `fn` while holding a MySQL advisory lock, so two overlapping cron runs
 *  never process the same queue at once. Returns null if the lock is taken. */
export async function withAdvisoryLock<T>(
  dataSource: DataSource,
  lockName: string,
  fn: () => Promise<T>,
): Promise<T | null> {
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  try {
    const [{ locked }] = (await runner.query('SELECT GET_LOCK(?, 0) AS locked', [
      lockName,
    ])) as { locked: number | string | null }[];
    if (Number(locked) !== 1) return null;
    try {
      return await fn();
    } finally {
      await runner.query('SELECT RELEASE_LOCK(?)', [lockName]);
    }
  } finally {
    await runner.release();
  }
}

/** Emails sent in the last hour from all queues, plus verification emails. An
 *  activity email that merged several likes/follows marks all its rows with
 *  one sent_at, so it counts once. */
export async function emailsSentInLastHour(dataSource: DataSource): Promise<number> {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const [row] = (await dataSource.query(
    `SELECT
       (SELECT COUNT(*) FROM post_email_queue WHERE sent_at >= ?) +
       (SELECT COUNT(*) FROM digest_email_queue WHERE sent_at >= ?) +
       (SELECT COUNT(*) FROM users WHERE verification_email_sent_at >= ?) +
       (SELECT COUNT(DISTINCT recipient_user_id, sent_at) FROM activity_email_queue WHERE sent_at >= ?)
     AS sent`,
    [since, since, since, since],
  )) as { sent: number | string }[];
  return Number(row?.sent ?? 0);
}

/** How many more queued emails this hour allows (0 = wait for the next run). */
export async function hourlyAllowance(dataSource: DataSource, hourlyLimit: number): Promise<number> {
  return Math.max(0, hourlyLimit - (await emailsSentInLastHour(dataSource)));
}

/** Uploads are stored as API-relative paths (/uploads/...); mail clients need absolute URLs. */
export function toAbsoluteUrl(apiUrl: string, url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
