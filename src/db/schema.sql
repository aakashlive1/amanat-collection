-- Cloudflare D1 SQLite Database Schema for Amanat Collection

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'collector')),
  password_hash TEXT NOT NULL,
  can_collect_all INTEGER NOT NULL DEFAULT 0, -- 1: Yes, 0: Only assigned
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  daily_amount REAL NOT NULL DEFAULT 0,
  assigned_collector_id TEXT REFERENCES users(id),
  unique_token TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL DEFAULT '1234',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES members(id),
  collector_id TEXT REFERENCES users(id),
  amount REAL NOT NULL,
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash', 'online')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending_verification')),
  utr_number TEXT,
  notes TEXT,
  collection_date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cash_settlements (
  id TEXT PRIMARY KEY,
  collector_id TEXT NOT NULL REFERENCES users(id),
  settlement_date TEXT NOT NULL,
  cash_collected REAL NOT NULL,
  cash_submitted REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'discrepancy')),
  notes TEXT,
  approved_by TEXT REFERENCES users(id),
  approved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indices for superfast lookups
CREATE INDEX IF NOT EXISTS idx_members_code ON members(code);
CREATE INDEX IF NOT EXISTS idx_members_token ON members(unique_token);
CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_collector_date ON transactions(collector_id, collection_date);
CREATE INDEX IF NOT EXISTS idx_settlements_collector ON cash_settlements(collector_id, settlement_date);
