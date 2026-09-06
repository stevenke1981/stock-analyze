-- HengYan local schema (SQLite for future Tauri / IndexedDB stores in web v1)
-- Cost method: average. Currency: TWD.

CREATE TABLE watchlist_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE watchlist_items (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES watchlist_groups(id),
  market TEXT NOT NULL,
  symbol TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  sort INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_watch_symbol ON watchlist_items(market, symbol);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  market TEXT NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  side TEXT NOT NULL,
  shares REAL NOT NULL,
  price REAL NOT NULL,
  fee REAL NOT NULL,
  tax REAL NOT NULL,
  trade_date TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX idx_txn_symbol ON transactions(market, symbol);
CREATE INDEX idx_txn_date ON transactions(trade_date);

CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  market TEXT,
  symbol TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE price_alerts (
  id TEXT PRIMARY KEY,
  market TEXT NOT NULL,
  symbol TEXT NOT NULL,
  op TEXT NOT NULL,
  price REAL NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL,
  triggered_at TEXT
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE quote_cache (
  cache_key TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  stored_at TEXT NOT NULL
);
