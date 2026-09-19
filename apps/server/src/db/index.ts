import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import * as schema from './schema'

// Native Bun SQLite database instance
const sqlite = new Database('sqlite.db')

// Create table if it doesn't exist automatically
sqlite.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  )
`)

export const db = drizzle(sqlite, { schema })
