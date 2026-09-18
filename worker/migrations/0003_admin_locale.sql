-- Admin Mini App language preference. Do not drop existing tables.

ALTER TABLE users ADD COLUMN admin_locale TEXT;
