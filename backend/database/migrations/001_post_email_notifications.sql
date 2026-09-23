-- New-post email notifications to TaskDesk interns.
--
-- You normally don't need to run this: the app applies the same schema on startup via
-- src/database/migrations/1790136000000-PostEmailNotifications.ts (migrationsRun: true).
-- Kept as a plain-SQL reference / manual fallback:
--   mysql -u <user> -p dawoodtech_community < database/migrations/001_post_email_notifications.sql

-- Set once the post's recipients have been queued, so a re-approval (e.g. after an edit)
-- or a retried request never emails the same post twice.
ALTER TABLE posts
  ADD COLUMN notified_at DATETIME NULL DEFAULT NULL AFTER reviewed_at;

CREATE TABLE IF NOT EXISTS post_email_queue (
  id              BIGINT NOT NULL AUTO_INCREMENT,
  post_id         BIGINT NOT NULL,
  email           VARCHAR(255) NOT NULL,
  recipient_name  VARCHAR(255) NULL DEFAULT NULL,
  status          ENUM('queued', 'sent', 'failed', 'skipped') NOT NULL DEFAULT 'queued',
  attempts        INT NOT NULL DEFAULT 0,
  last_attempt_at DATETIME NULL DEFAULT NULL,
  sent_at         DATETIME NULL DEFAULT NULL,
  error           VARCHAR(1000) NULL DEFAULT NULL,
  created_at      DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  -- One row per post per address: the enqueue step uses INSERT IGNORE against this.
  UNIQUE KEY uq_post_email_queue_post_email (post_id, email),
  KEY idx_post_email_queue_status (status),
  CONSTRAINT fk_post_email_queue_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Recommended: a read-only MySQL user for the TaskDesk lookup (run as root, adjust host/password):
--   CREATE USER 'community_ro'@'localhost' IDENTIFIED BY 'change-me';
--   GRANT SELECT ON task_management.registrations TO 'community_ro'@'localhost';
--   GRANT SELECT ON task_management.users TO 'community_ro'@'localhost';
