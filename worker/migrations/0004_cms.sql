-- Telegram CMS workflows, blog original text, and public website content.
-- Do not drop existing tables.

ALTER TABLE blog_articles ADD COLUMN original_text TEXT;
ALTER TABLE blog_articles ADD COLUMN archived_at TEXT;

CREATE TABLE IF NOT EXISTS admin_workflows (
  admin_telegram_id TEXT PRIMARY KEY,
  workflow TEXT NOT NULL,
  step TEXT NOT NULL,
  draft_id TEXT,
  extra TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS site_content (
  id TEXT PRIMARY KEY,
  page TEXT NOT NULL,
  section TEXT NOT NULL,
  field TEXT NOT NULL,
  locale TEXT NOT NULL,
  dict_path TEXT NOT NULL,
  published_value TEXT,
  draft_value TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_site_content_key
  ON site_content(page, section, field, locale);
CREATE INDEX IF NOT EXISTS idx_site_content_page ON site_content(page);
CREATE INDEX IF NOT EXISTS idx_site_content_status ON site_content(status);
