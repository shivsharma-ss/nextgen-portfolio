PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usage_visitors (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_seen_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS usage_sessions (
  id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  started_at INTEGER NOT NULL DEFAULT (unixepoch()),
  ended_at INTEGER,
  FOREIGN KEY (visitor_id) REFERENCES usage_visitors(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_usage_visitors_last_seen_at
  ON usage_visitors(last_seen_at);

CREATE INDEX IF NOT EXISTS idx_usage_sessions_visitor_id
  ON usage_sessions(visitor_id);

CREATE INDEX IF NOT EXISTS idx_usage_sessions_started_at
  ON usage_sessions(started_at);

CREATE INDEX IF NOT EXISTS idx_usage_sessions_visitor_id_started_at
  ON usage_sessions(visitor_id, started_at);

CREATE INDEX IF NOT EXISTS idx_usage_sessions_visitor_id_kind_started_at
  ON usage_sessions(visitor_id, kind, started_at);
