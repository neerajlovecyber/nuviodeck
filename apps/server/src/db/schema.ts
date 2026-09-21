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
  userId: text('user_id'),
  userEmail: text('user_email'),
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

export const accountConnections = sqliteTable('account_connections', {
  id: text('id').primaryKey(), // `${userId}:${provider}` or `${provider}`
  userId: text('user_id'),
  provider: text('provider').notNull(), // 'tmdb' | 'trakt' | 'simkl' | 'anilist' | 'myanimelist'
  username: text('username'),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: integer('expires_at'),
  scrobbleEnabled: integer('scrobble_enabled', { mode: 'boolean' }).default(true),
  extraJson: text('extra_json'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const userSettings = sqliteTable('user_settings', {
  userId: text('user_id').primaryKey(),
  settingsJson: text('settings_json').notNull(),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const playbackSessions = sqliteTable('playback_sessions', {
  id: text('id').primaryKey(), // `${profileId}:${mediaId}:${season || 0}:${episode || 0}`
  userId: text('user_id'),
  profileId: text('profile_id').notNull(),
  mediaId: text('media_id').notNull(),
  mediaType: text('media_type').notNull(), // 'movie' | 'series' | 'anime'
  title: text('title').notNull(),
  posterUrl: text('poster_url'),
  season: integer('season'),
  episode: integer('episode'),
  episodeTitle: text('episode_title'),
  runtimeMinutes: integer('runtime_minutes').default(24),
  startedAt: integer('started_at').notNull(),
  lastPositionMs: integer('last_position_ms').default(0),
  durationMs: integer('duration_ms').default(0),
  progressPercent: integer('progress_percent').default(0),
  completionMode: text('completion_mode').default('mark_as_watched'), // 'mark_as_watched' | 'only_when_finished'
  status: text('status').default('playing'), // 'playing' | 'paused' | 'completed'
  completedAt: integer('completed_at'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type NuvioSession = typeof nuvioSessions.$inferSelect
export type NewNuvioSession = typeof nuvioSessions.$inferInsert

export type DeckProfile = typeof deckProfiles.$inferSelect
export type NewDeckProfile = typeof deckProfiles.$inferInsert

export type AccountConnection = typeof accountConnections.$inferSelect
export type NewAccountConnection = typeof accountConnections.$inferInsert

export type UserSettings = typeof userSettings.$inferSelect
export type NewUserSettings = typeof userSettings.$inferInsert

export type PlaybackSession = typeof playbackSessions.$inferSelect
export type NewPlaybackSession = typeof playbackSessions.$inferInsert
