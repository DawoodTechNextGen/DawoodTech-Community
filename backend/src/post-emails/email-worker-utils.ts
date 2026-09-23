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
