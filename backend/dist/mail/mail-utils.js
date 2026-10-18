export async function withAdvisoryLock(dataSource, lockName, fn) {
    const runner = dataSource.createQueryRunner();
    await runner.connect();
    try {
        const [{ locked }] = (await runner.query('SELECT GET_LOCK(?, 0) AS locked', [lockName]));
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
    const [row] = (await dataSource.query('SELECT COUNT(*) AS sent FROM users WHERE verification_email_sent_at >= ?', [since]));
    return Number(row?.sent ?? 0);
}
export async function hourlyAllowance(dataSource, hourlyLimit) {
    return Math.max(0, hourlyLimit - (await emailsSentInLastHour(dataSource)));
}
export function errorMessage(err) {
    return err instanceof Error ? err.message : String(err);
}
export function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
//# sourceMappingURL=mail-utils.js.map