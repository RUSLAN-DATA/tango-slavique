-- Profile, blog and AI photo review. Do not drop existing tables.

ALTER TABLE photos ADD COLUMN is_primary INTEGER NOT NULL DEFAULT 0;
ALTER TABLE photos ADD COLUMN file_hash TEXT;

CREATE TABLE photo_reviews (
  id TEXT PRIMARY KEY,
  photo_id TEXT NOT NULL,
  review_status TEXT NOT NULL,
  reviewed_at TEXT,
  ai_provider TEXT,
  ai_model TEXT,
  confidence REAL,
  issues TEXT,
  main_person_detected INTEGER,
  face_visible INTEGER,
  quality TEXT,
  annotation_key TEXT,
  recommended_primary INTEGER,
  admin_override TEXT,
  admin_override_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (photo_id) REFERENCES photos(id)
);

CREATE TABLE blog_articles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  category TEXT,
  tags TEXT,
  cover_r2_key TEXT,
  published_at TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE blog_translations (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (article_id) REFERENCES blog_articles(id)
);

CREATE TABLE admin_inbox (
  id TEXT PRIMARY KEY,
  admin_telegram_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  r2_key TEXT,
  mime_type TEXT,
  caption TEXT,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_photo_reviews_photo_id ON photo_reviews(photo_id);
CREATE INDEX idx_photos_file_hash ON photos(file_hash);
CREATE UNIQUE INDEX idx_blog_articles_slug ON blog_articles(slug);
CREATE INDEX idx_blog_articles_status ON blog_articles(status);
CREATE UNIQUE INDEX idx_blog_translations_article_locale ON blog_translations(article_id, locale);
CREATE INDEX idx_admin_inbox_admin ON admin_inbox(admin_telegram_id);
