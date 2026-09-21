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
    smtp: {
        host: process.env.SMTP_HOST ?? '',
        port: parseInt(process.env.SMTP_PORT ?? '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER ?? '',
        pass: process.env.SMTP_PASS ?? '',
        from: process.env.MAIL_FROM ?? 'DawoodTech Community <no-reply@dawoodtechnextgen.com>',
    },
});
//# sourceMappingURL=configuration.js.map