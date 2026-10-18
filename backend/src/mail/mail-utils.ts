import type { DataSource } from 'typeorm';

/** Runs `fn` while holding a MySQL advisory lock, so two overlapping runs
 *  never process the same work at once. Returns null if the lock is taken. */
export async function withAdvisoryLock<T>(
  dataSource: DataSource,
  lockName: string,
  fn: () => Promise<T>,
): Promise<T | null> {
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  try {
    const [{ locked }] = (await runner.query('SELECT GET_LOCK(?, 0) AS locked', [lockName])) as {
      locked: number | string | null;
    }[];
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

/** Verification emails sent in the last hour. */
export async function emailsSentInLastHour(dataSource: DataSource): Promise<number> {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const [row] = (await dataSource.query(
    'SELECT COUNT(*) AS sent FROM users WHERE verification_email_sent_at >= ?',
    [since],
  )) as { sent: number | string }[];
  return Number(row?.sent ?? 0);
}

/** How many more emails this hour allows (0 = wait for the next run). */
export async function hourlyAllowance(
  dataSource: DataSource,
  hourlyLimit: number,
): Promise<number> {
  return Math.max(0, hourlyLimit - (await emailsSentInLastHour(dataSource)));
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Escapes text for safe use inside HTML email bodies and attributes. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
