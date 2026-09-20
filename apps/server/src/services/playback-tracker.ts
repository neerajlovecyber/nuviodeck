import { db } from '../db'
import { playbackSessions, accountConnections, type PlaybackSession } from '../db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { traktService } from './integrations/trakt'
import { simklService } from './integrations/simkl'
import { anilistService } from './integrations/anilist'
import { myAnimeListService } from './integrations/myanimelist'

export interface PlaybackStartInput {
  profileId: string
  mediaId: string
  mediaType: 'movie' | 'series' | 'anime'
  title: string
  posterUrl?: string
  season?: number
  episode?: number
  episodeTitle?: string
  runtimeMinutes?: number
  completionMode?: 'mark_as_watched' | 'only_when_finished'
}

export interface PlaybackProgressInput {
  profileId: string
  mediaId: string
  season?: number
  episode?: number
  positionMs: number
  durationMs: number
  status?: 'playing' | 'paused' | 'completed'
}

export class PlaybackTrackerService {
  /**
   * Helper to build session ID
   */
  private buildSessionId(profileId: string, mediaId: string, season = 0, episode = 0): string {
    return `${profileId}:${mediaId}:${season}:${episode}`
  }

  /**
   * 1. Handle playback start (from Nuvio player or Stremio stream request)
   */
  async handlePlaybackStart(input: PlaybackStartInput): Promise<PlaybackSession> {
    const now = Date.now()
    const isoNow = new Date(now).toISOString()
    const season = input.season || 0
    const episode = input.episode || 0
    const sessionId = this.buildSessionId(input.profileId, input.mediaId, season, episode)

    // Trigger B: Check if user was watching a previous episode of the same series
    if (episode > 1) {
      const prevEpisode = episode - 1
      const prevSessionId = this.buildSessionId(input.profileId, input.mediaId, season, prevEpisode)
      const [prevSession] = await db
        .select()
        .from(playbackSessions)
        .where(eq(playbackSessions.id, prevSessionId))
        .limit(1)

      if (prevSession && prevSession.status !== 'completed') {
        // User moved to the next episode -> mark previous episode completed!
        await this.markSessionCompleted(prevSession)
      }
    }

    const sessionData = {
      id: sessionId,
      profileId: input.profileId,
      mediaId: input.mediaId,
      mediaType: input.mediaType,
      title: input.title,
      posterUrl: input.posterUrl || null,
      season: input.season || null,
      episode: input.episode || null,
      episodeTitle: input.episodeTitle || null,
      runtimeMinutes: input.runtimeMinutes || (input.mediaType === 'movie' ? 100 : 24),
      startedAt: now,
      lastPositionMs: 0,
      durationMs: 0,
      progressPercent: 0,
      completionMode: input.completionMode || 'mark_as_watched',
      status: 'playing',
      completedAt: null,
      createdAt: isoNow,
      updatedAt: isoNow,
    }

    await db
      .insert(playbackSessions)
      .values(sessionData)
      .onConflictDoUpdate({
        target: playbackSessions.id,
        set: {
          startedAt: now,
          status: 'playing',
          completionMode: input.completionMode || 'mark_as_watched',
          updatedAt: isoNow,
        },
      })

    // Notify Trakt scrobbler of playback start
    await this.notifyTraktStart(input).catch(() => {})

    return sessionData as PlaybackSession
  }

  /**
   * 2. Handle native progress pings from Nuvio Player
   */
  async handlePlaybackProgress(input: PlaybackProgressInput): Promise<PlaybackSession | null> {
    const season = input.season || 0
    const episode = input.episode || 0
    const sessionId = this.buildSessionId(input.profileId, input.mediaId, season, episode)

    const [session] = await db
      .select()
      .from(playbackSessions)
      .where(eq(playbackSessions.id, sessionId))
      .limit(1)

    if (!session) return null

    const duration = input.durationMs || session.durationMs || 1
    const position = input.positionMs || session.lastPositionMs || 0
    const percent = Math.min(100, Math.max(0, Math.round((position / duration) * 100)))
    const isFinished = percent >= 90 || input.status === 'completed'
    const now = new Date().toISOString()

    if (isFinished) {
      // Finished! Mark completed across all connected trackers
      const updated = await this.markSessionCompleted(session)
      return updated
    }

    // Stopped / Paused early before 90%
    const status = input.status || 'paused'
    await db
      .update(playbackSessions)
      .set({
        lastPositionMs: position,
        durationMs: duration,
        progressPercent: percent,
        status,
        updatedAt: now,
      })
      .where(eq(playbackSessions.id, sessionId))

    // For Trakt: scrobble pause with current percentage -> lands in Trakt Continue Watching!
    await this.notifyTraktPause(session, percent).catch(() => {})

    const [updatedSession] = await db
      .select()
      .from(playbackSessions)
      .where(eq(playbackSessions.id, sessionId))
      .limit(1)

    return updatedSession || null
  }

  /**
   * 3. Mark session as completed and dispatch to all trackers
   */
  async markSessionCompleted(session: PlaybackSession): Promise<PlaybackSession> {
    const now = Date.now()
    const isoNow = new Date(now).toISOString()

    await db
      .update(playbackSessions)
      .set({
        status: 'completed',
        progressPercent: 100,
        completedAt: now,
        updatedAt: isoNow,
      })
      .where(eq(playbackSessions.id, session.id))

    // Dispatch to Trakt (Mark as watched)
    await this.notifyTraktStop(session).catch(() => {})

    // Dispatch to Simkl (Add to history)
    await this.notifySimklHistory(session).catch(() => {})

    // Dispatch to AniList (SaveMediaListEntry matching AnilistStream)
    await this.notifyAniListProgress(session).catch(() => {})

    // Dispatch to MyAnimeList
    await this.notifyMALProgress(session).catch(() => {})

    return {
      ...session,
      status: 'completed',
      progressPercent: 100,
      completedAt: now,
      updatedAt: isoNow,
    }
  }

  /**
   * 4. Check Stremio runtime timer expirations (Mode: "Mark as watched")
   */
  async checkRuntimeExpirations(): Promise<number> {
    const now = Date.now()
    const activeTimerSessions = await db
      .select()
      .from(playbackSessions)
      .where(
        and(
          eq(playbackSessions.status, 'playing'),
          eq(playbackSessions.completionMode, 'mark_as_watched')
        )
      )

    let completedCount = 0
    for (const s of activeTimerSessions) {
      const runtimeMs = (s.runtimeMinutes || 24) * 60 * 1000
      if (now >= s.startedAt + runtimeMs) {
        await this.markSessionCompleted(s)
        completedCount++
      }
    }
    return completedCount
  }

  /**
   * 5. Get Continue Watching row items for profile
   */
  async getContinueWatching(profileId: string, limit = 20): Promise<PlaybackSession[]> {
    return db
      .select()
      .from(playbackSessions)
      .where(
        and(
          eq(playbackSessions.profileId, profileId),
          sql`${playbackSessions.status} IN ('playing', 'paused')`,
          sql`${playbackSessions.progressPercent} >= 5`,
          sql`${playbackSessions.progressPercent} < 90`
        )
      )
      .orderBy(desc(playbackSessions.updatedAt))
      .limit(limit)
  }

  // --- Dispatch Helpers ---

  private async notifyTraktStart(input: PlaybackStartInput): Promise<void> {
    const [trakt] = await db.select().from(accountConnections).where(eq(accountConnections.id, 'trakt')).limit(1)
    if (!trakt || !trakt.scrobbleEnabled) return

    const numericTmdb = input.mediaId.startsWith('tmdb:')
      ? parseInt(input.mediaId.replace('tmdb:', ''), 10)
      : undefined
    const imdbId = input.mediaId.startsWith('tt') ? input.mediaId : undefined

    if (input.mediaType === 'movie') {
      await traktService.scrobbleStart(trakt.accessToken, {
        movie: { title: input.title, ids: { tmdb: numericTmdb, imdb: imdbId } },
        progress: 0,
      })
    } else {
      await traktService.scrobbleStart(trakt.accessToken, {
        show: { title: input.title, ids: { tmdb: numericTmdb, imdb: imdbId } },
        episode: { season: input.season || 1, number: input.episode || 1 },
        progress: 0,
      })
    }
  }

  private async notifyTraktPause(session: PlaybackSession, progressPercent: number): Promise<void> {
    const [trakt] = await db.select().from(accountConnections).where(eq(accountConnections.id, 'trakt')).limit(1)
    if (!trakt || !trakt.scrobbleEnabled) return

    const numericTmdb = session.mediaId.startsWith('tmdb:')
      ? parseInt(session.mediaId.replace('tmdb:', ''), 10)
      : undefined
    const imdbId = session.mediaId.startsWith('tt') ? session.mediaId : undefined

    if (session.mediaType === 'movie') {
      await traktService.scrobblePause(trakt.accessToken, {
        movie: { title: session.title, ids: { tmdb: numericTmdb, imdb: imdbId } },
        progress: progressPercent,
      })
    } else {
      await traktService.scrobblePause(trakt.accessToken, {
        show: { title: session.title, ids: { tmdb: numericTmdb, imdb: imdbId } },
        episode: { season: session.season || 1, number: session.episode || 1 },
        progress: progressPercent,
      })
    }
  }

  private async notifyTraktStop(session: PlaybackSession): Promise<void> {
    const [trakt] = await db.select().from(accountConnections).where(eq(accountConnections.id, 'trakt')).limit(1)
    if (!trakt || !trakt.scrobbleEnabled) return

    const numericTmdb = session.mediaId.startsWith('tmdb:')
      ? parseInt(session.mediaId.replace('tmdb:', ''), 10)
      : undefined
    const imdbId = session.mediaId.startsWith('tt') ? session.mediaId : undefined

    if (session.mediaType === 'movie') {
      await traktService.scrobbleStop(trakt.accessToken, {
        movie: { title: session.title, ids: { tmdb: numericTmdb, imdb: imdbId } },
        progress: 100,
      })
    } else {
      await traktService.scrobbleStop(trakt.accessToken, {
        show: { title: session.title, ids: { tmdb: numericTmdb, imdb: imdbId } },
        episode: { season: session.season || 1, number: session.episode || 1 },
        progress: 100,
      })
    }
  }

  private async notifySimklHistory(session: PlaybackSession): Promise<void> {
    const [simkl] = await db.select().from(accountConnections).where(eq(accountConnections.id, 'simkl')).limit(1)
    if (!simkl) return

    const numericTmdb = session.mediaId.startsWith('tmdb:')
      ? parseInt(session.mediaId.replace('tmdb:', ''), 10)
      : undefined
    const imdbId = session.mediaId.startsWith('tt') ? session.mediaId : undefined

    await simklService.addToHistory(simkl.accessToken, {
      ids: { tmdb: numericTmdb, imdb: imdbId },
    })
  }

  private async notifyAniListProgress(session: PlaybackSession): Promise<void> {
    if (session.mediaType !== 'anime' && !session.mediaId.startsWith('anilist:')) return
    const [anilist] = await db.select().from(accountConnections).where(eq(accountConnections.id, 'anilist')).limit(1)
    if (!anilist) return

    const anilistId = parseInt(session.mediaId.replace('anilist:', ''), 10)
    if (!anilistId || isNaN(anilistId)) return

    await anilistService.updateProgress(
      anilist.accessToken,
      anilistId,
      session.episode || 1,
      'CURRENT'
    )
  }

  private async notifyMALProgress(session: PlaybackSession): Promise<void> {
    if (session.mediaType !== 'anime' && !session.mediaId.startsWith('mal:')) return
    const [mal] = await db.select().from(accountConnections).where(eq(accountConnections.id, 'myanimelist')).limit(1)
    if (!mal) return

    const malId = parseInt(session.mediaId.replace('mal:', ''), 10)
    if (!malId || isNaN(malId)) return

    await myAnimeListService.updateProgress(
      mal.accessToken,
      malId,
      session.episode || 1,
      'watching'
    )
  }
}

export const playbackTrackerService = new PlaybackTrackerService()
