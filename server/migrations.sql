-- Migrações DDL para Biazotto CMS (Compatível com Cloudflare D1 e SQLite Nativo)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  must_change_password INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  csrf_token TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id TEXT PRIMARY KEY,
  ip_address TEXT NOT NULL,
  username TEXT NOT NULL,
  attempted_at INTEGER NOT NULL,
  success INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_login_attempts ON login_attempts (ip_address, username, attempted_at);

CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  section_key TEXT NOT NULL,
  section_type TEXT NOT NULL,
  background_style TEXT DEFAULT 'white',
  padding_preset TEXT DEFAULT 'normal',
  order_index INTEGER DEFAULT 0,
  is_visible INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sections_page ON sections (page_id, order_index);

CREATE TABLE IF NOT EXISTS blocks (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL,
  block_key TEXT NOT NULL,
  block_type TEXT NOT NULL,
  content_json TEXT NOT NULL,
  visual_config_json TEXT DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  is_visible INTEGER DEFAULT 1,
  version INTEGER DEFAULT 1,
  updated_at INTEGER NOT NULL,
  updated_by TEXT,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_blocks_section ON blocks (section_id, order_index);

CREATE TABLE IF NOT EXISTS navigation_items (
  id TEXT PRIMARY KEY,
  menu_location TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  target TEXT DEFAULT '_self',
  order_index INTEGER DEFAULT 0,
  is_cta INTEGER DEFAULT 0,
  is_visible INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  width INTEGER DEFAULT 0,
  height INTEGER DEFAULT 0,
  alt_text TEXT DEFAULT '',
  storage_path TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  created_by TEXT
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS published_versions (
  id TEXT PRIMARY KEY,
  version_number INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_published_versions_num ON published_versions (version_number DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  user_id TEXT,
  ip_address TEXT,
  details_json TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs (created_at DESC);
