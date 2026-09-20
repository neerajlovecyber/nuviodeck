import { describe, it, expect } from 'bun:test'
import { Hono } from 'hono'
import { progressRouter } from '../src/routes/progress'
import { playbackTrackerService } from '../src/services/playback-tracker'
import { db } from '../src/db'
import { playbackSessions } from '../src/db/schema'
import { eq } from 'drizzle-orm'

const app = new Hono()
app.route('/api/progress', progressRouter)

describe('Playback Tracker & Completion Engine (Stremio Timer & Nuvio Finish Modes)', () => {
  const profileId = 'test-profile-1'
  const seriesId = 'tmdb:1399' // Game of Thrones

  it('POST /api/progress/playback/start creates a playback session', async () => {
    const res = await app.request('/api/progress/playback/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId,
        mediaId: seriesId,
        mediaType: 'series',
        title: 'Game of Thrones',
        season: 1,
        episode: 1,
        episodeTitle: 'Winter Is Coming',
        runtimeMinutes: 60,
        completionMode: 'only_when_finished',
      }),
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.session.status).toBe('playing')
    expect(data.session.episode).toBe(1)
    expect(data.session.completionMode).toBe('only_when_finished')
  })

  it('POST /api/progress/playback/update records partial progress (Stop early: In-Progress / Continue Watching)', async () => {
    const res = await app.request('/api/progress/playback/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId,
        mediaId: seriesId,
        season: 1,
        episode: 1,
        positionMs: 1200000, // 20 mins
        durationMs: 3600000, // 60 mins -> ~33%
        status: 'paused',
      }),
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.session.progressPercent).toBe(33)
    expect(data.session.status).toBe('paused')
  })

  it('GET /api/progress/continue-watching/:profileId lists in-progress titles', async () => {
    const res = await app.request(`/api/progress/continue-watching/${profileId}`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.total).toBeGreaterThan(0)
    const found = data.items.find((item: any) => item.id === seriesId && item.episode === 1)
    expect(found).toBeDefined()
    expect(found.progressPercent).toBe(33)
    expect(found.minutesLeft).toBe(40)
  })

  it('Trigger B (Next Episode Started): Starting Episode 2 marks Episode 1 as completed', async () => {
    // User starts Episode 2
    const res = await app.request('/api/progress/playback/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId,
        mediaId: seriesId,
        mediaType: 'series',
        title: 'Game of Thrones',
        season: 1,
        episode: 2,
        episodeTitle: 'The Kingsroad',
        runtimeMinutes: 60,
        completionMode: 'only_when_finished',
      }),
    })
    expect(res.status).toBe(200)

    // Check Episode 1 in SQLite
    const ep1SessionId = `${profileId}:${seriesId}:1:1`
    const [ep1] = await db
      .select()
      .from(playbackSessions)
      .where(eq(playbackSessions.id, ep1SessionId))
      .limit(1)

    expect(ep1).toBeDefined()
    expect(ep1.status).toBe('completed')
    expect(ep1.progressPercent).toBe(100)
  })

  it('Trigger A (90% Threshold): Nuvio ping reaching 95% marks episode completed', async () => {
    const res = await app.request('/api/progress/playback/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId,
        mediaId: seriesId,
        season: 1,
        episode: 2,
        positionMs: 3450000, // 57.5 mins
        durationMs: 3600000, // 60 mins -> ~96%
        status: 'playing',
      }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.session.status).toBe('completed')
    expect(data.session.progressPercent).toBe(100)
  })

  it('Mode 1 ("mark_as_watched"): Auto-completes when runtime timer expires', async () => {
    const movieMediaId = 'tmdb:550' // Fight Club
    // Start session backdated by 150 minutes ago with 120 min runtime
    const now = Date.now()
    const pastTime = now - 150 * 60 * 1000

    const session = await playbackTrackerService.handlePlaybackStart({
      profileId,
      mediaId: movieMediaId,
      mediaType: 'movie',
      title: 'Fight Club',
      runtimeMinutes: 120,
      completionMode: 'mark_as_watched',
    })

    // Manually backdate startedAt to simulate elapsed runtime
    await db
      .update(playbackSessions)
      .set({ startedAt: pastTime })
      .where(eq(playbackSessions.id, session.id))

    // Run expiration check
    const checkRes = await app.request('/api/progress/check-expirations', {
      method: 'POST',
    })
    expect(checkRes.status).toBe(200)
    const checkData = await checkRes.json()
    expect(checkData.expiredAndMarkedWatched).toBeGreaterThanOrEqual(1)

    // Verify session in DB is now marked completed
    const [updated] = await db
      .select()
      .from(playbackSessions)
      .where(eq(playbackSessions.id, session.id))
      .limit(1)

    expect(updated.status).toBe('completed')
    expect(updated.progressPercent).toBe(100)
  })
})
