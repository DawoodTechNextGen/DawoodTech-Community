export default () => ({
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    db: {
        host: process.env.DB_HOST ?? '127.0.0.1',
        port: parseInt(process.env.DB_PORT ?? '3306', 10),
        username: process.env.DB_USERNAME ?? 'root',
        password: process.env.DB_PASSWORD ?? '',
        database: process.env.DB_DATABASE ?? 'dawoodtech_community',
    },
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
        refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
        emailTokenSecret: process.env.JWT_EMAIL_TOKEN_SECRET ?? 'dev-email-token-secret',
    },
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
        .split(',')
        .map((origin) => origin.trim()),
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3001',
    communityUrl: (process.env.COMMUNITY_URL ||
        process.env.FRONTEND_URL ||
        'http://localhost:3001').replace(/\/+$/, ''),
    apiPublicUrl: (process.env.API_PUBLIC_URL || 'http://localhost:3000').replace(/\/+$/, ''),
    smtp: {
        host: process.env.MAIL_HOST || process.env.SMTP_HOST || '',
        port: parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || '587', 10),
        secure: process.env.MAIL_ENCRYPTION
            ? process.env.MAIL_ENCRYPTION.toLowerCase() === 'ssl'
            : process.env.SMTP_SECURE === 'true',
        user: process.env.MAIL_USERNAME || process.env.SMTP_USER || '',
        pass: process.env.MAIL_PASSWORD || process.env.SMTP_PASS || '',
        from: process.env.MAIL_FROM_EMAIL
            ? {
                name: process.env.MAIL_FROM_NAME || 'DawoodTech Community',
                address: process.env.MAIL_FROM_EMAIL,
            }
            : (process.env.MAIL_FROM ?? 'DawoodTech Community <no-reply@dawoodtechnextgen.com>'),
    },
    taskdeskDb: {
        host: process.env.TASKDESK_DB_HOST || process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.TASKDESK_DB_PORT || process.env.DB_PORT || '3306', 10),
        user: process.env.TASKDESK_DB_USER ?? '',
        password: process.env.TASKDESK_DB_PASS ?? '',
        database: process.env.TASKDESK_DB_NAME || 'task_management',
    },
    postEmails: {
        mode: (process.env.POST_EMAIL_MODE ?? 'dry_run'),
        testRecipient: process.env.POST_EMAIL_TEST_RECIPIENT ?? '',
        batchSize: parseInt(process.env.POST_EMAIL_BATCH_SIZE ?? '50', 10),
        delayMs: parseInt(process.env.POST_EMAIL_DELAY_MS ?? '1000', 10),
        maxAttempts: 3,
        hourlyLimit: parseInt(process.env.EMAIL_HOURLY_LIMIT ?? '20', 10),
        digestHour: parseInt(process.env.DIGEST_HOUR ?? '9', 10),
        digestTimeZone: process.env.DIGEST_TIMEZONE || 'Asia/Karachi',
        activityMode: (process.env.ACTIVITY_EMAIL_MODE ??
            process.env.POST_EMAIL_MODE ??
            'dry_run'),
    },
});
//# sourceMappingURL=configuration.js.map