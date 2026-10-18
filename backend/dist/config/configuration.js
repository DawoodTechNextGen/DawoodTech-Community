const DEV_SECRETS = {
    JWT_ACCESS_SECRET: 'dev-access-secret',
    JWT_REFRESH_SECRET: 'dev-refresh-secret',
    JWT_EMAIL_TOKEN_SECRET: 'dev-email-token-secret',
};
function secret(name) {
    const value = process.env[name];
    if (value && !value.startsWith('change-me'))
        return value;
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        return value || DEV_SECRETS[name];
    }
    throw new Error(`${name} must be set to a long random value in .env`);
}
export default () => ({
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    db: {
        host: process.env.DB_HOST ?? '127.0.0.1',
        port: parseInt(process.env.DB_PORT ?? '3306', 10),
        username: process.env.DB_USERNAME ?? 'root',
        password: process.env.DB_PASSWORD ?? '',
        database: process.env.DB_DATABASE ?? 'dawoodtech_community',
        synchronize: process.env.DB_SYNCHRONIZE === 'true',
    },
    trustProxy: parseInt(process.env.TRUST_PROXY ?? '1', 10),
    jwt: {
        accessSecret: secret('JWT_ACCESS_SECRET'),
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
        refreshSecret: secret('JWT_REFRESH_SECRET'),
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
        emailTokenSecret: secret('JWT_EMAIL_TOKEN_SECRET'),
    },
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
        .split(',')
        .map((origin) => origin.trim()),
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3001',
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
    timeZone: process.env.APP_TIMEZONE || 'Asia/Karachi',
    autoApproveAfter: parseInt(process.env.AUTO_APPROVE_AFTER ?? '3', 10),
    emailHourlyLimit: parseInt(process.env.EMAIL_HOURLY_LIMIT ?? '20', 10),
    push: {
        publicKey: process.env.VAPID_PUBLIC_KEY ?? '',
        privateKey: process.env.VAPID_PRIVATE_KEY ?? '',
        subject: process.env.VAPID_SUBJECT || 'mailto:no-reply@dawoodtechnextgen.com',
    },
});
//# sourceMappingURL=configuration.js.map