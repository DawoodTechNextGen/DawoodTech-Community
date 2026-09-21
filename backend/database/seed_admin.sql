-- Seeds (or promotes) the default DawoodTech Community admin account.
-- Idempotent: safe to re-run — inserts if missing, otherwise just forces role=admin.
--
-- Email:    info@dawoodtechnextgen.com
-- Password: GenNext@@0099   (bcrypt hash below, cost factor 12 — matches backend/src/auth/auth.service.ts)
--
-- Run against the `dawoodtech_community` database, e.g.:
--   mysql -u root dawoodtech_community < database/seed_admin.sql

INSERT INTO users (email, username, password_hash, full_name, role, status, is_email_verified)
VALUES (
  'info@dawoodtechnextgen.com',
  'dawoodtech_admin',
  '$2b$12$drkLHzWNyL6KLB8R0lpBr.59SxY/evvX.y4Y3wX8LfhqNZvNqKPSa',
  'DawoodTech Admin',
  'admin',
  'active',
  1
)
ON DUPLICATE KEY UPDATE
  role = 'admin',
  status = 'active',
  is_email_verified = 1;
