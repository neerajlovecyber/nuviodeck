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
    user_id TEXT,
    user_email TEXT,
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
    user_id TEXT,
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

  CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    settings_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS playback_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    profile_id TEXT NOT NULL,
    media_id TEXT NOT NULL,
    media_type TEXT NOT NULL,
    title TEXT NOT NULL,
    poster_url TEXT,
    season INTEGER,
    episode INTEGER,
    episode_title TEXT,
    runtime_minutes INTEGER DEFAULT 24,
    started_at INTEGER NOT NULL,
    last_position_ms INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    progress_percent INTEGER DEFAULT 0,
    completion_mode TEXT DEFAULT 'mark_as_watched',
    status TEXT DEFAULT 'playing',
    completed_at INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`)

// Safe schema migration helper for existing SQLite databases
function ensureColumn(table: string, column: string, type: string) {
  try {
    const columns = sqlite.query(`PRAGMA table_info(${table})`).all() as any[]
    const exists = columns.some((c) => c.name === column)
    if (!exists) {
      sqlite.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`)
    }
  } catch (err) {
    console.warn(`Could not add column ${column} to table ${table}:`, err)
  }
}

ensureColumn('deck_profiles', 'user_id', 'TEXT')
ensureColumn('deck_profiles', 'user_email', 'TEXT')
ensureColumn('account_connections', 'user_id', 'TEXT')
ensureColumn('playback_sessions', 'user_id', 'TEXT')

export const db = drizzle(sqlite, { schema })
