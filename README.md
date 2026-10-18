# DawoodTech Community

An internal social platform for DawoodTech interns to share success stories, comment on each other's posts, and follow the people they learn from most — with **no private messaging** and **admin-moderated posts**.

## Features

- **Auth** — email/password signup and login, JWT access + rotating refresh tokens, email verification required before login, forgot/reset password via emailed link
- **Feed** — a personalized "For You" feed (posts from people you follow) with an "Explore" fallback, cursor-paginated
- **Posts** — text + optional image, held as `pending` until an admin approves them — nothing reaches the feed unmoderated
- **Comments & likes** on approved posts
- **Follow / unfollow** other users
- **Live notifications** — comments, likes, follows, and post approval/rejection arrive instantly in the app (Socket.IO): unread badge, a pop-up, and the notifications page update live. No notification emails are sent
- **Admin review queue** — approve or reject pending posts; trusted members (`AUTO_APPROVE_AFTER` approved posts, no recent rejection) and staff skip it; admins get a push alert for each new pending post and see the average wait
- **Web Push** — phone/desktop notifications even when the app is closed (VAPID keys in `.env`)
- **Getting started checklist** — photo, bio, follow 3 people, first post, device alerts; new members auto-follow staff so the feed is never empty
- **Daily question + streaks** — a rotating question answerable from the feed; 🔥 streak of consecutive active days
- **Welcome posts** — an automatic "just joined" post when a new member verifies their email
- **@mentions & shoutouts** — `@username` autocomplete and notifications; a Shoutout button in the composer
- **Reactions** — ❤️ 👏 🎉 💡 🔥 (one per member per post; only the first one notifies)
- **Leaderboard & badges** — weekly points (post 5, comment 2, reaction received 1) and profile badges
- **Pinned announcements** — admins pin up to 3 posts above the feed, optionally notifying everyone
- **Questions, #tags & search** — ask questions and accept an answer, `#hashtags` with tag pages and a Trending card, member/post search
- **Admin insights** — active members (day/week/month), 14-day activity, how many new members came back
- **Profiles** — bio, avatar upload, follower/following counts, a user's own post history
- **PWA** — installable, with a service worker for the app shell

## Tech stack

| | |
|---|---|
| **Backend** | NestJS (ESM), TypeORM, MySQL, JWT (`@nestjs/jwt`), Passport, class-validator, Multer, Nodemailer, Socket.IO (`@nestjs/websockets`) |
| **Frontend** | Next.js (App Router), TypeScript, Tailwind CSS v4, Riverpod-free client state via React context |
| **Auth** | Short-lived access tokens + rotating refresh tokens (hashed at rest), bcrypt password hashing |
| **Email** | Nodemailer over SMTP; falls back to logging the email to the console when no SMTP is configured, so the verify/reset flow is testable without a mail provider |

## Project structure

```
dawoodtech-community/
├── backend/                 # NestJS API
│   ├── database/
│   │   └── seed_admin.sql   # seeds/promotes the default admin account
│   └── src/
│       ├── auth/            # signup, login, refresh, verify-email, forgot/reset password
│       ├── users/            # profiles, updates
│       ├── posts/           # create/feed/explore + admin approve/reject
│       ├── comments/, likes/, follows/, notifications/
│       ├── uploads/         # image upload (post media, avatars)
│       ├── mail/            # SMTP sending + console fallback
│       ├── common/          # guards, decorators, filters
│       └── database/        # TypeORM entities
└── web/                      # Next.js client
    └── app/
        ├── login/, signup/, verify-email/, forgot-password/, reset-password/
        ├── feed/, post/[id]/, profile/[id]/, notifications/
        └── admin/review/     # admin-only moderation queue
```

## Getting started

### Prerequisites

- Node.js 20+
- MySQL (or MariaDB) running locally

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

Create the database once, then either seed the default admin or promote an account you sign up with:

```bash
mysql -u root -e "CREATE DATABASE dawoodtech_community CHARACTER SET utf8mb4;"
mysql -u root dawoodtech_community < database/seed_admin.sql
```

The default seeded admin:

```
Email:    info@dawoodtechnextgen.com
Password: GenNext@@0099
```

Tables are created automatically on first run (`synchronize: true` outside production) — no separate migration step needed for local dev.

### 2. Frontend

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3001`.

## Environment variables

**`backend/.env`**

| Variable | Purpose |
|---|---|
| `DB_*` | MySQL connection |
| `DB_SYNCHRONIZE` | `true` lets TypeORM change the schema to match the entities on startup. Local development only — never on the live server (schema changes there ship as migrations) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / `JWT_EMAIL_TOKEN_SECRET` | Signing secrets for access tokens, refresh tokens, and email verification/reset links. **Required** unless `NODE_ENV` is `development` or `test` — the app refuses to start without them (or with the `change-me` placeholders) |
| `TRUST_PROXY` | Number of reverse proxies in front of the API (default `1`, cPanel/LiteSpeed), so rate limits see real visitor IPs |
| `APP_TIMEZONE` | The community's calendar for daily questions and streaks (default `Asia/Karachi`) |
| `AUTO_APPROVE_AFTER` | Approved posts after which a member's posts skip review (default 3, `0` = always review) |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web Push. Generate once per environment with `npx web-push generate-vapid-keys` and keep them — new keys invalidate every subscription. Push is off while empty |
| `EMAIL_HOURLY_LIMIT` | Most verification emails the background retry sends per rolling hour (default 20) |
| `FRONTEND_URL` | Used to build the links sent in verification/reset emails |
| `CORS_ORIGINS` | Comma-separated list of allowed origins (the Next.js dev server, e.g. `http://localhost:3001`) |
| `SMTP_*` / `MAIL_FROM` | Outgoing mail. Leave `SMTP_HOST` empty to log emails to the console instead of sending them — handy for local development |

**`web/.env.local`**

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API |

## Verification emails that fail at signup

Signup never fails because of mail. If the verification email can't be sent (mail server busy or over its hourly cap), the account is still created and `users.verification_email_sent_at` stays empty. The app then retries those emails by itself, right after it starts and every 10 minutes while it runs, within `EMAIL_HOURLY_LIMIT`, giving up on an address after 3 failed tries. Nothing to add to cron. The login page also lets members resend the email themselves.

## Live notifications (WebSocket)

Likes, comments, replies, follows and post approval/rejection are stored in the `notifications` table and pushed straight to the recipient's open tabs over Socket.IO — nothing is emailed. Signup verification and password-reset are the only emails the app sends.

- **Endpoint:** Socket.IO namespace `/notifications` on the API (default path `/socket.io`). The client sends its access token in the handshake (`auth.token`); an invalid or expired token is rejected with `connect_error: unauthorized`, and the web app refreshes the token and reconnects.
- **Events (server → client):** `notification:new` `{ notification, unreadCount }`, `notification:unread-count` `{ count }` (read in another tab), and for admins `admin:pending-posts-changed` (the review queue changed).
- Blocking a member or changing their role closes their live connections immediately.
- Socket.IO falls back to HTTP long-polling where the host doesn't pass WebSockets through. Run the API as a **single process** (rooms live in memory); with several processes you'd need sticky sessions and a Socket.IO adapter such as Redis.
- **Upgrading from the email version:** delete the old `post-emails.js` cron job — `node dist/cli/post-emails.js` now does nothing except `resend-verification`. The old email tables (`post_email_queue`, `activity_email_queue`, `email_digests`, `digest_email_queue`) and the `posts.notify_by_email` / `posts.notified_at` columns are no longer used and can be dropped whenever you like.

Resend verification emails to everyone who never verified (within `EMAIL_HOURLY_LIMIT`; run again for the rest):

```bash
cd backend && node dist/cli/post-emails.js resend-verification
```

## Post moderation

Every post is created with `status = pending` and is excluded from all feeds until an admin approves it via the review queue (`/admin/review` in the app, or `PATCH /admin/posts/:id/approve` on the API). There is no self-service "become admin" path by design — see `database/seed_admin.sql` or promote an existing account manually:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```
