import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const nuvioSessions = sqliteTable('nuvio_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  email: text('email').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: integer('expires_at').notNull(),
  activeProfileIndex: integer('active_profile_index').default(1),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const deckProfiles = sqliteTable('deck_profiles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(false),
  status: text('status').default('Ready'),
  rowCount: integer('row_count').default(24),
  collectionCount: integer('collection_count').default(1),
  avatarId: text('avatar_id'),
  avatarUrl: text('avatar_url'),
  badgeSetId: text('badge_set_id'),
  configJson: text('config_json'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type NuvioSession = typeof nuvioSessions.$inferSelect
export type NewNuvioSession = typeof nuvioSessions.$inferInsert

export type DeckProfile = typeof deckProfiles.$inferSelect
export type NewDeckProfile = typeof deckProfiles.$inferInsert
