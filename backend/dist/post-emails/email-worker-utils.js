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