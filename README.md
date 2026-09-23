# DawoodTech Community

An internal social platform for DawoodTech interns to share success stories, comment on each other's posts, and follow the people they learn from most — with **no private messaging** and **admin-moderated posts**.

## Features

- **Auth** — email/password signup and login, JWT access + rotating refresh tokens, email verification required before login, forgot/reset password via emailed link
- **Feed** — a personalized "For You" feed (posts from people you follow) with an "Explore" fallback, cursor-paginated
- **Posts** — text + optional image, held as `pending` until an admin approves them — nothing reaches the feed unmoderated
- **Comments & likes** on approved posts
- **Follow / unfollow** other users
- **Notifications** — comments, likes, follows, and post approval/rejection, polled in the background
- **Admin review queue** — approve or reject pending posts, admin-only route guard
- **Profiles** — bio, avatar upload, follower/following counts, a user's own post history
- **PWA** — installable, with a service worker for the app shell

## Tech stack

| | |
|---|---|
| **Backend** | NestJS (ESM), TypeORM, MySQL, JWT (`@nestjs/jwt`), Passport, class-validator, Multer, Nodemailer |
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
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / `JWT_EMAIL_TOKEN_SECRET` | Signing secrets for access tokens, refresh tokens, and email verification/reset links |
| `FRONTEND_URL` | Used to build the links sent in verification/reset emails |
| `CORS_ORIGINS` | Comma-separated list of allowed origins (the Next.js dev server, e.g. `http://localhost:3001`) |
| `SMTP_*` / `MAIL_FROM` | Outgoing mail. Leave `SMTP_HOST` empty to log emails to the console instead of sending them — handy for local development |

**`web/.env.local`**

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API |

## Verification emails that fail at signup

Signup never fails because of mail. If the verification email can't be sent (mail server busy or over its hourly cap), the account is still created and `users.verification_email_sent_at` stays empty. The app then retries those emails by itself, right after it starts and every 10 minutes while it runs, within `EMAIL_HOURLY_LIMIT`, giving up on an address after 3 failed tries. Nothing to add to cron. The login page also lets members resend the email themselves.

## Daily digest of new posts to interns and community members

New posts are emailed as **one daily digest** per person, not one email per post. When an admin approves a post with **"Include in the daily email digest"** checked (the default), the post is only marked. Once a day, on the first cron run after `DIGEST_HOUR` (default 9, in `DIGEST_TIMEZONE`, default `Asia/Karachi`), every marked post goes into that day's digest and one email per recipient is queued. However many posts were approved, each person gets one email a day. It lists up to 10 posts, then "and N more" with a link to the feed.

- **Recipients:** read-only query against TaskDesk's database (`TASKDESK_DB_*`). This covers every row in `registrations` (any status) plus `users` with `user_role` 2 (intern) or 6 (candidate). Active, email-verified community members are added on top. Emails are trimmed and lowercased, then de-duplicated, so someone in both gets one email. Invalid addresses are skipped.
- **Once per post, once per day:** building a digest sets `posts.notified_at` on its posts, so re-approving after an edit never re-sends. `email_digests.digest_key` (the local date) is unique, so a day can never get two digests. A day with no new posts still records an empty digest, so a post approved after that day's digest waits for tomorrow's.
- **Queue + worker:** a cron job sends up to `POST_EMAIL_BATCH_SIZE` queued emails per run with `POST_EMAIL_DELAY_MS` between them. A failed send is retried on later runs and marked `failed` after 3 attempts. MySQL advisory locks stop overlapping runs from double-building or double-sending.
- **Hourly limit:** `EMAIL_HOURLY_LIMIT` (default 20) caps how many queued emails (digest + like/comment/follow together) go out in any rolling hour. Set it well below your mail server's own hourly cap so signup, verification and password-reset emails, which are sent straight away, always have room. Like/comment/follow emails get first pick; the digest uses what's left and simply waits for later runs.
- **Admin:** the review queue page shows the next digest time, the posts waiting for it, and queued / sent / failed counts for recent digests.
- **Older queue:** emails queued one-per-post before the digest existed (`post_email_queue`) are still sent by the same cron until that queue is empty.

**Setup (production):**

1. Nothing to run for the database. The tables and column are created on startup by the TypeORM migration in `src/database/migrations/` (`migrationsRun: true`), including in production where `synchronize` is off. `backend/database/migrations/001_post_email_notifications.sql` is the same schema as plain SQL, if you ever need to apply it by hand.
2. Set the `MAIL_*`, `COMMUNITY_URL`, and `TASKDESK_DB_*` keys from `.env.example`.
3. Add the cron job (cPanel → Cron Jobs), every 2 minutes, running from `backend/` so `.env` is loaded:

   ```
   */2 * * * * cd /home/<cpanel-user>/<app-path>/backend && /usr/bin/env node dist/cli/post-emails.js >> post-emails.log 2>&1
   ```

   On CloudLinux/cPanel, use the full Node binary path shown in *Setup Node.js App* (e.g. `/opt/alt/alt-nodejs20/root/usr/bin/node`) instead of `/usr/bin/env node`.

**Testing before real interns get anything.** `POST_EMAIL_MODE` defaults to `dry_run`.

| Step | How |
|---|---|
| See the recipient list | `node dist/cli/post-emails.js recipients` (sends nothing) |
| Preview the digest in your inbox | `node dist/cli/post-emails.js test you@example.com`: the posts waiting for the next digest, or the latest 3 |
| Build today's digest now | `node dist/cli/post-emails.js digest`: doesn't wait for `DIGEST_HOUR`, still only once per day |
| Dry-run | `POST_EMAIL_MODE=dry_run`: the day's digest logs "Digest … would go to X recipients: …" in the cron log. Nothing is queued and the posts stay unsent. |
| Full pipeline to only you | `POST_EMAIL_MODE=test` + `POST_EMAIL_TEST_RECIPIENT=you@example.com`: the digest is queued for just your address and the cron worker sends it; the posts stay unsent for the real digest |
| Go live | `POST_EMAIL_MODE=live`, then restart the app |

## Like / comment / follow emails to community members

Community members also get an email when someone interacts with their content or follows them:

| Who | When | Email says |
|---|---|---|
| Post owner | Someone likes their post | "Sara liked your post" (likes still waiting in the queue are merged: "Sara and 2 others liked your post") |
| Post owner | Someone comments on their post | "Sara commented on your post" + the comment text |
| Comment author | Someone replies to their comment | "Sara replied to your comment" |
| Everyone who commented earlier | Someone else comments on the same post | "Sara also commented on a post you commented on" |
| Followed member | Someone follows them | "Sara started following you" (merged like likes: "Sara and 2 others started following you") |

- Each person gets **one** email per comment, picked in that priority order, and nobody is emailed about their own action.
- Only active, email-verified members are emailed.
- Unliking and re-liking, or unfollowing and re-following, never sends twice (queue rows are unique per like/comment/follow + recipient). A like removed, a comment deleted or a follow undone before the worker runs is skipped.
- Same queue + cron worker as new-post emails (`activity_email_queue`, created by migration on startup). The existing cron command sends both, nothing extra to set up.
- `ACTIVITY_EMAIL_MODE` works like `POST_EMAIL_MODE` (`dry_run` / `test` / `live`) and defaults to it.

## Post moderation

Every post is created with `status = pending` and is excluded from all feeds until an admin approves it via the review queue (`/admin/review` in the app, or `PATCH /admin/posts/:id/approve` on the API). There is no self-service "become admin" path by design — see `database/seed_admin.sql` or promote an existing account manually:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```
