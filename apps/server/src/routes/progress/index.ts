import { Hono } from 'hono'
import { EventEmitter } from 'events'
import { streamSSE } from 'hono/streaming'
import { playbackTrackerService } from '../../services/playback-tracker'

export const progressRouter = new Hono()

// Central Event Emitter for Multi-Device Real-Time Sync
const broadcastEmitter = new EventEmitter()
broadcastEmitter.setMaxListeners(200)

export function broadcastPlaybackEvent(profileId: string, event: string, data: any) {
  broadcastEmitter.emit('playback', { profileId, event, data, timestamp: Date.now() })
}

// Real-Time Playback & Device Broadcast SSE Stream
// GET /api/progress/events (optional ?profileId=xxx)
progressRouter.get('/events', async (c) => {
  const profileId = c.req.query('profileId')

  return streamSSE(c, async (stream) => {
    // 1. Initial Connection Handshake
    await stream.writeSSE({
      event: 'connected',
      data: JSON.stringify({
        status: 'connected',
        profileId: profileId || 'all',
        timestamp: Date.now(),
      }),
    })

    // 2. Event Listener
    const listener = (payload: any) => {
      if (!profileId || payload.profileId === profileId) {
        stream.writeSSE({
          event: payload.event,
          data: JSON.stringify(payload),
        })
      }
    }

    broadcastEmitter.on('playback', listener)

    stream.onAbort(() => {
      broadcastEmitter.off('playback', listener)
    })

    // 3. Keepalive Ping every 25 seconds
    while (true) {
      await stream.sleep(25000)
      await stream.writeSSE({
        event: 'ping',
        data: JSON.stringify({ timestamp: Date.now() }),
      })
    }
  })
})

// Playback started
progressRouter.post('/playback/start', async (c) => {
  try {
    const body = await c.req.json()
    if (!body.profileId || !body.mediaId || !body.title) {
      return c.json({ error: 'profileId, mediaId, and title are required' }, 400)
    }

    const session = await playbackTrackerService.handlePlaybackStart(body)
    broadcastPlaybackEvent(body.profileId, 'playback.started', session)
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
    broadcastPlaybackEvent(body.profileId, 'playback.progress', session)
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
    broadcastPlaybackEvent(body.profileId, 'playback.stopped', session)
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

    if (session) {
      const eventName = session.status === 'completed' ? 'playback.completed' : 'playback.progress'
      broadcastPlaybackEvent(profileId, eventName, session)
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
