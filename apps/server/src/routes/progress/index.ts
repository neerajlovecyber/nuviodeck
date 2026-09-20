import { Hono } from 'hono'
import { playbackTrackerService } from '../../services/playback-tracker'

export const progressRouter = new Hono()

// Playback started
progressRouter.post('/playback/start', async (c) => {
  try {
    const body = await c.req.json()
    if (!body.profileId || !body.mediaId || !body.title) {
      return c.json({ error: 'profileId, mediaId, and title are required' }, 400)
    }

    const session = await playbackTrackerService.handlePlaybackStart(body)
    return c.json({ success: true, session })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Native Progress Ping (from Nuvio TV / Mobile / Web Player)
progressRouter.post('/playback/update', async (c) => {
  try {
    const body = await c.req.json()
    if (!body.profileId || !body.mediaId) {
      return c.json({ error: 'profileId and mediaId are required' }, 400)
    }

    const session = await playbackTrackerService.handlePlaybackProgress(body)
    return c.json({ success: true, session })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Playback stopped / closed
progressRouter.post('/playback/stop', async (c) => {
  try {
    const body = await c.req.json()
    if (!body.profileId || !body.mediaId) {
      return c.json({ error: 'profileId and mediaId are required' }, 400)
    }

    const session = await playbackTrackerService.handlePlaybackProgress({
      ...body,
      status: 'paused',
    })
    return c.json({ success: true, session })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Get Continue Watching items for profile
progressRouter.get('/continue-watching/:profileId', async (c) => {
  try {
    const profileId = c.req.param('profileId')
    const limit = parseInt(c.req.query('limit') || '20', 10)
    const items = await playbackTrackerService.getContinueWatching(profileId, limit)

    return c.json({
      profileId,
      total: items.length,
      items: items.map((item) => ({
        id: item.mediaId,
        type: item.mediaType,
        name: item.title,
        poster: item.posterUrl,
        season: item.season,
        episode: item.episode,
        episodeTitle: item.episodeTitle,
        progressPercent: item.progressPercent,
        lastPositionMs: item.lastPositionMs || 0,
        durationMs: item.durationMs || 0,
        minutesLeft: Math.max(0, Math.round(((item.durationMs || 0) - (item.lastPositionMs || 0)) / 60000)),
        updatedAt: item.updatedAt,
      })),
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Stremio-compatible Scrobble Ingestion Endpoint
progressRouter.post('/scrobble', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const { profileId, id, type, progress, time, duration, title } = body

    if (!profileId || !id) {
      return c.json({ error: 'profileId and id are required' }, 400)
    }

    const durationMs = duration ? duration * 1000 : 0
    const positionMs = time ? time * 1000 : (progress ? (progress / 100) * durationMs : 0)

    let session = await playbackTrackerService.handlePlaybackProgress({
      profileId,
      mediaId: id,
      positionMs,
      durationMs,
      status: (progress && progress >= 80) ? 'completed' : 'playing',
    })

    if (!session) {
      await playbackTrackerService.handlePlaybackStart({
        profileId,
        mediaId: id,
        mediaType: type || 'movie',
        title: title || id,
        runtimeMinutes: duration ? Math.round(duration / 60) : 100,
      })

      session = await playbackTrackerService.handlePlaybackProgress({
        profileId,
        mediaId: id,
        positionMs,
        durationMs,
        status: (progress && progress >= 80) ? 'completed' : 'playing',
      })
    }

    return c.json({ success: true, session })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Manual or cron trigger to check Stremio runtime expirations
progressRouter.post('/check-expirations', async (c) => {
  try {
    const count = await playbackTrackerService.checkRuntimeExpirations()
    return c.json({ success: true, expiredAndMarkedWatched: count })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})
