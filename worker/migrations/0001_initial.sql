CREATE TABLE users (
  id TEXT PRIMARY KEY,
  telegram_user_id TEXT,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  birth_date TEXT,
  gender TEXT,
  city TEXT,
  country TEXT,
  about TEXT,
  occupation TEXT,
  education TEXT,
  languages TEXT,
  children TEXT,
  marital_status TEXT,
  height INTEGER,
  hobbies TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE applications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  message TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE partner_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  gender TEXT,
  age_min INTEGER,
  age_max INTEGER,
  city TEXT,
  country TEXT,
  marital_status TEXT,
  children TEXT,
  languages TEXT,
  intent TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE photos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  matched_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'proposed',
  score INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (matched_user_id) REFERENCES users(id)
);

CREATE TABLE match_responses (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (match_id) REFERENCES matches(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE introductions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  matched_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (matched_user_id) REFERENCES users(id)
);

CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_user_id TEXT,
  rating INTEGER,
  message TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (target_user_id) REFERENCES users(id)
);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  channel TEXT NOT NULL,
  type TEXT NOT NULL,
  payload TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE admin_notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  admin_telegram_id TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE admin_actions (
  id TEXT PRIMARY KEY,
  admin_telegram_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX idx_users_telegram_user_id ON users(telegram_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE UNIQUE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

CREATE UNIQUE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_status ON profiles(status);

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at);
CREATE INDEX idx_applications_email ON applications(email);

CREATE UNIQUE INDEX idx_partner_preferences_user_id ON partner_preferences(user_id);

CREATE UNIQUE INDEX idx_photos_r2_key ON photos(r2_key);
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_status ON photos(status);
CREATE INDEX idx_photos_created_at ON photos(created_at);

CREATE INDEX idx_matches_user_id ON matches(user_id);
CREATE INDEX idx_matches_matched_user_id ON matches(matched_user_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_created_at ON matches(created_at);
CREATE UNIQUE INDEX idx_matches_pair ON matches(user_id, matched_user_id);

CREATE INDEX idx_match_responses_match_id ON match_responses(match_id);
CREATE INDEX idx_match_responses_user_id ON match_responses(user_id);

CREATE INDEX idx_introductions_user_id ON introductions(user_id);
CREATE INDEX idx_introductions_matched_user_id ON introductions(matched_user_id);
CREATE INDEX idx_introductions_status ON introductions(status);

CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_admin_notes_user_id ON admin_notes(user_id);
CREATE INDEX idx_admin_actions_entity ON admin_actions(entity_type, entity_id);
