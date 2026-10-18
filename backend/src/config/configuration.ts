const DEV_SECRETS = {
  JWT_ACCESS_SECRET: 'dev-access-secret',
  JWT_REFRESH_SECRET: 'dev-refresh-secret',
  JWT_EMAIL_TOKEN_SECRET: 'dev-email-token-secret',
} as const;

/** A JWT secret from the environment. The well-known dev fallback is only
 *  allowed when NODE_ENV is explicitly development or test — anywhere else a
 *  missing secret would let anyone sign their own (admin) tokens. */
function secret(name: keyof typeof DEV_SECRETS): string {
  const value = process.env[name];
  if (value && !value.startsWith('change-me')) return value;
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
  // How many reverse proxies sit in front of the API (cPanel/LiteSpeed = 1),
  // so rate limits see the visitor's real IP instead of the proxy's.
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
  // Most verification emails the background retry may send in any rolling
  // hour. Keep it below the mail server's own hourly cap so signup and
  // password-reset emails always have room left.
  // Members with this many approved posts (and no rejection in 30 days) skip
  // the review queue. 0 = every member's post is reviewed. Staff always skip.
  // The community's calendar: when "today" starts for daily questions and streaks.
  timeZone: process.env.APP_TIMEZONE || 'Asia/Karachi',
  autoApproveAfter: parseInt(process.env.AUTO_APPROVE_AFTER ?? '3', 10),
  emailHourlyLimit: parseInt(process.env.EMAIL_HOURLY_LIMIT ?? '20', 10),
  // Web Push (VAPID). Generate once with `npx web-push generate-vapid-keys`;
  // push stays off while these are empty.
  push: {
    publicKey: process.env.VAPID_PUBLIC_KEY ?? '',
    privateKey: process.env.VAPID_PRIVATE_KEY ?? '',
    subject: process.env.VAPID_SUBJECT || 'mailto:no-reply@dawoodtechnextgen.com',
  },
});
