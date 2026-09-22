-- Website onboarding fields. Do not drop existing tables.

ALTER TABLE profiles ADD COLUMN current_step INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN privacy_accepted_at TEXT;
ALTER TABLE profiles ADD COLUMN terms_accepted_at TEXT;
ALTER TABLE profiles ADD COLUMN details TEXT;

ALTER TABLE partner_preferences ADD COLUMN details TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_web_email
  ON users(email)
  WHERE telegram_user_id IS NULL AND email IS NOT NULL AND email != '';
