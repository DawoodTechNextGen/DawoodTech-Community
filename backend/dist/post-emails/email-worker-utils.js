export function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
export async function withAdvisoryLock(dataSource, lockName, fn) {
    const runner = dataSource.createQueryRunner();
    await runner.connect();
    try {
        const [{ locked }] = (await runner.query('SELECT GET_LOCK(?, 0) AS locked', [
            lockName,
        ]));
        if (Number(locked) !== 1)
            return null;
        try {
            return await fn();
        }
        finally {
            await runner.query('SELECT RELEASE_LOCK(?)', [lockName]);
        }
    }
    finally {
        await runner.release();
    }
}
export async function emailsSentInLastHour(dataSource) {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const [row] = (await dataSource.query(`SELECT
       (SELECT COUNT(*) FROM post_email_queue WHERE sent_at >= ?) +
       (SELECT COUNT(*) FROM digest_email_queue WHERE sent_at >= ?) +
       (SELECT COUNT(*) FROM users WHERE verification_email_sent_at >= ?) +
       (SELECT COUNT(DISTINCT recipient_user_id, sent_at) FROM activity_email_queue WHERE sent_at >= ?)
     AS sent`, [since, since, since, since]));
    return Number(row?.sent ?? 0);
}
export async function hourlyAllowance(dataSource, hourlyLimit) {
    return Math.max(0, hourlyLimit - (await emailsSentInLastHour(dataSource)));
}
export function toAbsoluteUrl(apiUrl, url) {
    if (!url)
        return null;
    if (/^https?:\/\//i.test(url))
        return url;
    return `${apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}
export function errorMessage(err) {
    return err instanceof Error ? err.message : String(err);
}
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=email-worker-utils.js.map