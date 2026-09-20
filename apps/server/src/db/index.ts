import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import * as schema from './schema'

// Native Bun SQLite database instance
const sqlite = new Database('sqlite.db')

// Create tables if they don't exist automatically
sqlite.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS nuvio_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    active_profile_index INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS deck_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_active INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Ready',
    row_count INTEGER DEFAULT 24,
    collection_count INTEGER DEFAULT 1,
    avatar_id TEXT,
    avatar_url TEXT,
    badge_set_id TEXT,
    config_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS account_connections (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at INTEGER,
    scrobble_enabled INTEGER DEFAULT 1,
    extra_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`)

// Seed initial default profiles if empty (like Xperience)
const countResult = sqlite.query('SELECT COUNT(*) as count FROM deck_profiles').get() as any
if (countResult && countResult.count === 0) {
  const now = new Date().toISOString()
  sqlite.run(`
    INSERT INTO deck_profiles (id, name, is_active, status, row_count, collection_count, badge_set_id, created_at, updated_at)
    VALUES 
      ('prof-indian', 'Indian', 1, 'Ready', 31, 1, 'xp_aurora', '${now}', '${now}'),
      ('prof-new', 'new', 0, 'Ready', 24, 3, 'xp_onyx', '${now}', '${now}');
  `)
}

export const db = drizzle(sqlite, { schema })
