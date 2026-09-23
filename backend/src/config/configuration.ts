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
  // Public site used for links in outgoing notification emails.
  communityUrl: (
    process.env.COMMUNITY_URL ||
    process.env.FRONTEND_URL ||
    'http://localhost:3001'
  ).replace(/\/+$/, ''),
  // Public URL of this API — uploaded images (/uploads/...) in emails are served from here.
  apiPublicUrl: (process.env.API_PUBLIC_URL || 'http://localhost:3000').replace(/\/+$/, ''),
  // MAIL_* are the keys TaskDesk uses, so the same values can be copied over;
  // the older SMTP_* / MAIL_FROM keys still work as a fallback.
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
  // Read-only connection to TaskDesk, the source of "new post" email recipients.
  taskdeskDb: {
    host: process.env.TASKDESK_DB_HOST || process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.TASKDESK_DB_PORT || process.env.DB_PORT || '3306', 10),
    user: process.env.TASKDESK_DB_USER ?? '',
    password: process.env.TASKDESK_DB_PASS ?? '',
    database: process.env.TASKDESK_DB_NAME || 'task_management',
  },
  postEmails: {
    // live    — queue every TaskDesk intern
    // test    — queue only POST_EMAIL_TEST_RECIPIENT, so one real email goes out
    // dry_run — queue nothing; log the recipient list that *would* be queued
    mode: (process.env.POST_EMAIL_MODE ?? 'dry_run') as 'live' | 'test' | 'dry_run',
    testRecipient: process.env.POST_EMAIL_TEST_RECIPIENT ?? '',
    batchSize: parseInt(process.env.POST_EMAIL_BATCH_SIZE ?? '50', 10),
    delayMs: parseInt(process.env.POST_EMAIL_DELAY_MS ?? '1000', 10),
    maxAttempts: 3,
    // Like/comment/reply emails to community members. Same modes as above; in
    // test mode they're all redirected to POST_EMAIL_TEST_RECIPIENT.
    activityMode: (process.env.ACTIVITY_EMAIL_MODE ??
      process.env.POST_EMAIL_MODE ??
      'dry_run') as 'live' | 'test' | 'dry_run',
  },
});
