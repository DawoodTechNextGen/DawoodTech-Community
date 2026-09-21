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

## Post moderation

Every post is created with `status = pending` and is excluded from all feeds until an admin approves it via the review queue (`/admin/review` in the app, or `PATCH /admin/posts/:id/approve` on the API). There is no self-service "become admin" path by design — see `database/seed_admin.sql` or promote an existing account manually:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```
