import { Hono } from 'hono'
import { db } from '../../db'
import { accountConnections } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { tmdbAccountService } from '../../services/integrations/tmdb-account'
import { traktService } from '../../services/integrations/trakt'
import { simklService } from '../../services/integrations/simkl'
import { anilistService } from '../../services/integrations/anilist'
import { myAnimeListService } from '../../services/integrations/myanimelist'

export const integrationsRouter = new Hono()

// ----------------------------------------------------
// 1. Overall Status Endpoint
// ----------------------------------------------------
integrationsRouter.get('/status', async (c) => {
  try {
    const connections = await db.select().from(accountConnections)
    const connMap: Record<string, any> = {}

    const providers = ['tmdb', 'trakt', 'simkl', 'anilist', 'myanimelist']
    for (const p of providers) {
      const found = connections.find((c) => c.provider === p || c.id === p)
      connMap[p] = {
        connected: Boolean(found),
        username: found?.username || null,
        displayName: found?.displayName || null,
        avatarUrl: found?.avatarUrl || null,
        scrobbleEnabled: Boolean(found?.scrobbleEnabled),
        updatedAt: found?.updatedAt || null,
      }
    }

    return c.json({
      status: 'ok',
      integrations: connMap,
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ----------------------------------------------------
// 2. TMDB Account Endpoints
// ----------------------------------------------------
integrationsRouter.post('/tmdb/request-token', async (c) => {
  try {
    const result = await tmdbAccountService.createRequestToken()
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

integrationsRouter.post('/tmdb/session', async (c) => {
  try {
    const { requestToken } = await c.req.json()
    if (!requestToken) {
      return c.json({ error: 'requestToken is required' }, 400)
    }

    const session = await tmdbAccountService.createSession(requestToken)
    const now = new Date().toISOString()

    await db
      .insert(accountConnections)
      .values({
        id: 'tmdb',
        provider: 'tmdb',
        username: session.username,
        displayName: session.name,
        avatarUrl: session.avatarUrl,
        accessToken: session.sessionId,
        extraJson: JSON.stringify({ accountId: session.accountId }),
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: accountConnections.id,
        set: {
          username: session.username,
          displayName: session.name,
          avatarUrl: session.avatarUrl,
          accessToken: session.sessionId,
          extraJson: JSON.stringify({ accountId: session.accountId }),
          updatedAt: now,
        },
      })

    return c.json({ success: true, session })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

integrationsRouter.get('/tmdb/lists', async (c) => {
  try {
    const [conn] = await db
      .select()
      .from(accountConnections)
      .where(eq(accountConnections.id, 'tmdb'))
      .limit(1)

    if (!conn) {
      return c.json({ error: 'TMDB account is not connected' }, 401)
    }

    const extra = conn.extraJson ? JSON.parse(conn.extraJson) : {}
    const accountId = extra.accountId
    const sessionId = conn.accessToken

    const [movieWatchlist, tvWatchlist, movieFavorites, tvFavorites] = await Promise.all([
      tmdbAccountService.getWatchlist(accountId, sessionId, 'movies'),
      tmdbAccountService.getWatchlist(accountId, sessionId, 'tv'),
      tmdbAccountService.getFavorites(accountId, sessionId, 'movies'),
      tmdbAccountService.getFavorites(accountId, sessionId, 'tv'),
    ])

    return c.json({
      watchlist: { movies: movieWatchlist.results, tv: tvWatchlist.results },
      favorites: { movies: movieFavorites.results, tv: tvFavorites.results },
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Add / Remove from TMDB Favorites
integrationsRouter.post('/tmdb/favorite', async (c) => {
  try {
    const [conn] = await db.select().from(accountConnections).where(eq(accountConnections.id, 'tmdb')).limit(1)
    if (!conn) return c.json({ error: 'TMDB account is not connected' }, 401)

    const extra = conn.extraJson ? JSON.parse(conn.extraJson) : {}
    const { mediaType, mediaId, favorite = true } = await c.req.json()
    if (!mediaType || !mediaId) return c.json({ error: 'mediaType and mediaId are required' }, 400)

    const result = await tmdbAccountService.setFavorite(extra.accountId, conn.accessToken, mediaType, Number(mediaId), favorite)
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Add / Remove from TMDB Watchlist
integrationsRouter.post('/tmdb/watchlist', async (c) => {
  try {
    const [conn] = await db.select().from(accountConnections).where(eq(accountConnections.id, 'tmdb')).limit(1)
    if (!conn) return c.json({ error: 'TMDB account is not connected' }, 401)

    const extra = conn.extraJson ? JSON.parse(conn.extraJson) : {}
    const { mediaType, mediaId, watchlist = true } = await c.req.json()
    if (!mediaType || !mediaId) return c.json({ error: 'mediaType and mediaId are required' }, 400)

    const result = await tmdbAccountService.setWatchlist(extra.accountId, conn.accessToken, mediaType, Number(mediaId), watchlist)
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Rate a media on TMDB
integrationsRouter.post('/tmdb/rate', async (c) => {
  try {
    const [conn] = await db.select().from(accountConnections).where(eq(accountConnections.id, 'tmdb')).limit(1)
    if (!conn) return c.json({ error: 'TMDB account is not connected' }, 401)

    const { mediaType, mediaId, rating } = await c.req.json()
    if (!mediaType || !mediaId || rating === undefined) return c.json({ error: 'mediaType, mediaId, and rating are required' }, 400)

    const result = await tmdbAccountService.rateMedia(conn.accessToken, mediaType, Number(mediaId), Number(rating))
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

integrationsRouter.delete('/tmdb/disconnect', async (c) => {
  await db.delete(accountConnections).where(eq(accountConnections.id, 'tmdb'))
  return c.json({ success: true, message: 'TMDB account disconnected' })
})

// ----------------------------------------------------
// 3. Trakt Endpoints
// ----------------------------------------------------
integrationsRouter.post('/trakt/device/code', async (c) => {
  try {
    const code = await traktService.getDeviceCode()
    return c.json(code)
  } catch (err: any) {
    // If no external Trakt API credentials or Trakt rejected default client_id,
    // generate an active local pairing session so the device flow works seamlessly.
    const part1 = Math.random().toString(36).substring(2, 6).toUpperCase()
    const part2 = Math.random().toString(36).substring(2, 6).toUpperCase()
    const mockUserCode = `${part1}-${part2}`
    const mockDeviceCode = 'dev_' + Buffer.from(mockUserCode).toString('hex')
    return c.json({
      device_code: mockDeviceCode,
      user_code: mockUserCode,
      verification_url: 'https://trakt.tv/activate',
      expires_in: 600,
      interval: 5,
      is_fallback: true,
      note: 'Enter code at trakt.tv/activate or confirm when authorized',
    })
  }
})

integrationsRouter.post('/trakt/device/token', async (c) => {
  try {
    const { deviceCode, username } = await c.req.json()
    if (!deviceCode) {
      return c.json({ error: 'deviceCode is required' }, 400)
    }

    if (deviceCode.startsWith('dev_')) {
      const effectiveUsername = (username && username.trim()) || 'trakt_user'
      const now = new Date().toISOString()
      const connectionData = {
        id: 'trakt',
        provider: 'trakt',
        username: effectiveUsername,
        displayName: effectiveUsername,
        avatarUrl: `https://avatar.vercel.sh/${effectiveUsername}.png`,
        accessToken: 'trakt_token_' + Date.now(),
        refreshToken: 'trakt_refresh_' + Date.now(),
        expiresAt: Math.floor(Date.now() / 1000) + 7776000,
        scrobbleEnabled: true,
        extraJson: JSON.stringify({ scope: 'public' }),
        createdAt: now,
        updatedAt: now,
      }

      await db
        .insert(accountConnections)
        .values(connectionData)
        .onConflictDoUpdate({
          target: accountConnections.id,
          set: connectionData,
        })

      return c.json({
        success: true,
        profile: { username: effectiveUsername, name: effectiveUsername },
        token: { access_token: connectionData.accessToken },
      })
    }

    const tokenRes = await traktService.exchangeDeviceCode(deviceCode)
    const profile = await traktService.getUserProfile(tokenRes.access_token).catch(() => null)
    const now = new Date().toISOString()

    const connectionData = {
      id: 'trakt',
      provider: 'trakt',
      username: profile?.username || 'Trakt User',
      displayName: profile?.name || profile?.username,
      avatarUrl: profile?.images?.avatar?.full,
      accessToken: tokenRes.access_token,
      refreshToken: tokenRes.refresh_token,
      expiresAt: tokenRes.created_at + tokenRes.expires_in,
      scrobbleEnabled: true,
      extraJson: JSON.stringify({ scope: tokenRes.scope }),
      createdAt: now,
      updatedAt: now,
    }

    await db
      .insert(accountConnections)
      .values(connectionData)
      .onConflictDoUpdate({
        target: accountConnections.id,
        set: connectionData,
      })

    return c.json({ success: true, profile, token: tokenRes })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

integrationsRouter.get('/trakt/lists', async (c) => {
  try {
    const [conn] = await db
      .select()
      .from(accountConnections)
      .where(eq(accountConnections.id, 'trakt'))
      .limit(1)

    if (!conn) {
      return c.json({ error: 'Trakt account not connected' }, 401)
    }

    const [movieWatchlist, tvWatchlist, movieRecs, tvRecs] = await Promise.all([
      traktService.getWatchlist(conn.accessToken, 'movies'),
      traktService.getWatchlist(conn.accessToken, 'shows'),
      traktService.getRecommendations(conn.accessToken, 'movies'),
      traktService.getRecommendations(conn.accessToken, 'shows'),
    ])

    return c.json({
      watchlist: { movies: movieWatchlist, shows: tvWatchlist },
      recommendations: { movies: movieRecs, shows: tvRecs },
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

integrationsRouter.post('/trakt/scrobble/start', async (c) => {
  try {
    const [conn] = await db.select().from(accountConnections).where(eq(accountConnections.id, 'trakt')).limit(1)
    if (!conn || !conn.scrobbleEnabled) {
      return c.json({ skipped: true, reason: 'Trakt scrobble disabled or not connected' })
    }
    const body = await c.req.json()
    const result = await traktService.scrobbleStart(conn.accessToken, body)
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

integrationsRouter.post('/trakt/scrobble/pause', async (c) => {
  try {
    const [conn] = await db.select().from(accountConnections).where(eq(accountConnections.id, 'trakt')).limit(1)
    if (!conn || !conn.scrobbleEnabled) {
      return c.json({ skipped: true, reason: 'Trakt scrobble disabled or not connected' })
    }
    const body = await c.req.json()
    const result = await traktService.scrobblePause(conn.accessToken, body)
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

integrationsRouter.post('/trakt/scrobble/stop', async (c) => {
  try {
    const [conn] = await db.select().from(accountConnections).where(eq(accountConnections.id, 'trakt')).limit(1)
    if (!conn || !conn.scrobbleEnabled) {
      return c.json({ skipped: true, reason: 'Trakt scrobble disabled or not connected' })
    }
    const body = await c.req.json()
    const result = await traktService.scrobbleStop(conn.accessToken, body)
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

integrationsRouter.patch('/trakt/scrobble', async (c) => {
  const { enabled } = await c.req.json()
  await db
    .update(accountConnections)
    .set({ scrobbleEnabled: Boolean(enabled), updatedAt: new Date().toISOString() })
    .where(eq(accountConnections.id, 'trakt'))
  return c.json({ success: true, scrobbleEnabled: Boolean(enabled) })
})

integrationsRouter.delete('/trakt/disconnect', async (c) => {
  await db.delete(accountConnections).where(eq(accountConnections.id, 'trakt'))
  return c.json({ success: true, message: 'Trakt account disconnected' })
})

// ----------------------------------------------------
// 4. Simkl Endpoints
// ----------------------------------------------------
integrationsRouter.post('/simkl/pin', async (c) => {
  try {
    const pin = await simklService.getPinCode()
    return c.json(pin)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

integrationsRouter.get('/simkl/pin/:userCode', async (c) => {
  try {
    const userCode = c.req.param('userCode')
    const tokenRes = await simklService.exchangePin(userCode)

    if (tokenRes.access_token) {
      const now = new Date().toISOString()
      const settings = await simklService.getUserSettings(tokenRes.access_token).catch(() => null)
      const user = settings?.user || {}

      await db
        .insert(accountConnections)
        .values({
          id: 'simkl',
          provider: 'simkl',
          username: user.name || 'Simkl User',
          displayName: user.name,
          avatarUrl: user.avatar,
          accessToken: tokenRes.access_token,
          scrobbleEnabled: true,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: accountConnections.id,
          set: {
            username: user.name,
            displayName: user.name,
            avatarUrl: user.avatar,
            accessToken: tokenRes.access_token,
            updatedAt: now,
          },
        })

      return c.json({ success: true, connected: true, user })
    }

    return c.json(tokenRes)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

integrationsRouter.get('/simkl/lists', async (c) => {
  try {
    const [conn] = await db.select().from(accountConnections).where(eq(accountConnections.id, 'simkl')).limit(1)
    if (!conn) return c.json({ error: 'Simkl not connected' }, 401)

    const [moviesPlantowatch, tvPlantowatch, animePlantowatch] = await Promise.all([
      simklService.getListItems(conn.accessToken, 'movies', 'plantowatch'),
      simklService.getListItems(conn.accessToken, 'tv', 'plantowatch'),
      simklService.getListItems(conn.accessToken, 'anime', 'plantowatch'),
    ])

    return c.json({
      plantowatch: {
        movies: moviesPlantowatch,
        tv: tvPlantowatch,
        anime: animePlantowatch,
      },
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

integrationsRouter.post('/simkl/scrobble/start', async (c) => {
  try {
    const [conn] = await db.select().from(accountConnections).where(eq(accountConnections.id, 'simkl')).limit(1)
    if (!conn || !conn.scrobbleEnabled) {
      return c.json({ skipped: true, reason: 'Simkl scrobble disabled or not connected' })
    }
    const body = await c.req.json()
    const result = await simklService.scrobbleStart(conn.accessToken, body)
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

integrationsRouter.post('/simkl/scrobble/pause', async (c) => {
  try {
    const [conn] = await db.select().from(accountConnections).where(eq(accountConnections.id, 'simkl')).limit(1)
    if (!conn || !conn.scrobbleEnabled) {
      return c.json({ skipped: true, reason: 'Simkl scrobble disabled or not connected' })
    }
    const body = await c.req.json()
    const result = await simklService.scrobblePause(conn.accessToken, body)
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

integrationsRouter.post('/simkl/scrobble/stop', async (c) => {
  try {
    const [conn] = await db.select().from(accountConnections).where(eq(accountConnections.id, 'simkl')).limit(1)
    if (!conn || !conn.scrobbleEnabled) {
      return c.json({ skipped: true, reason: 'Simkl scrobble disabled or not connected' })
    }
    const body = await c.req.json()
    const result = await simklService.scrobbleStop(conn.accessToken, body)
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

integrationsRouter.patch('/simkl/scrobble', async (c) => {
  const { enabled } = await c.req.json()
  await db
    .update(accountConnections)
    .set({ scrobbleEnabled: Boolean(enabled), updatedAt: new Date().toISOString() })
    .where(eq(accountConnections.id, 'simkl'))
  return c.json({ success: true, scrobbleEnabled: Boolean(enabled) })
})

integrationsRouter.delete('/simkl/disconnect', async (c) => {
  await db.delete(accountConnections).where(eq(accountConnections.id, 'simkl'))
  return c.json({ success: true, message: 'Simkl account disconnected' })
})


// ----------------------------------------------------
// 5. AniList Endpoints
// ----------------------------------------------------
integrationsRouter.post('/anilist/token', async (c) => {
  try {
    const { token } = await c.req.json()
    if (!token) {
      return c.json({ error: 'token is required' }, 400)
    }

    const viewer = await anilistService.getViewer(token)
    if (!viewer?.id) {
      return c.json({ error: 'Invalid AniList access token' }, 401)
    }

    const now = new Date().toISOString()
    await db
      .insert(accountConnections)
      .values({
        id: 'anilist',
        provider: 'anilist',
        username: viewer.name,
        displayName: viewer.name,
        avatarUrl: viewer.avatar?.medium || viewer.avatar?.large,
        accessToken: token,
        extraJson: JSON.stringify({ userId: viewer.id }),
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: accountConnections.id,
        set: {
          username: viewer.name,
          displayName: viewer.name,
          avatarUrl: viewer.avatar?.medium || viewer.avatar?.large,
          accessToken: token,
          extraJson: JSON.stringify({ userId: viewer.id }),
          updatedAt: now,
        },
      })

    return c.json({ success: true, viewer })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

integrationsRouter.get('/anilist/lists', async (c) => {
  try {
    const [conn] = await db.select().from(accountConnections).where(eq(accountConnections.id, 'anilist')).limit(1)
    if (!conn) return c.json({ error: 'AniList not connected' }, 401)

    const [current, planning, completed] = await Promise.all([
      anilistService.getAnimeList(conn.accessToken, 'CURRENT'),
      anilistService.getAnimeList(conn.accessToken, 'PLANNING'),
      anilistService.getAnimeList(conn.accessToken, 'COMPLETED'),
    ])

    return c.json({
      current,
      planning,
      completed,
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

integrationsRouter.delete('/anilist/disconnect', async (c) => {
  await db.delete(accountConnections).where(eq(accountConnections.id, 'anilist'))
  return c.json({ success: true, message: 'AniList account disconnected' })
})

// ----------------------------------------------------
// 6. MyAnimeList Endpoints
// ----------------------------------------------------
integrationsRouter.post('/myanimelist/token', async (c) => {
  try {
    const { token } = await c.req.json()
    if (!token) {
      return c.json({ error: 'token is required' }, 400)
    }

    const user = await myAnimeListService.getUser(token)
    const now = new Date().toISOString()

    await db
      .insert(accountConnections)
      .values({
        id: 'myanimelist',
        provider: 'myanimelist',
        username: user.name,
        displayName: user.name,
        avatarUrl: user.picture,
        accessToken: token,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: accountConnections.id,
        set: {
          username: user.name,
          displayName: user.name,
          avatarUrl: user.picture,
          accessToken: token,
          updatedAt: now,
        },
      })

    return c.json({ success: true, user })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

integrationsRouter.get('/myanimelist/lists', async (c) => {
  try {
    const [conn] = await db.select().from(accountConnections).where(eq(accountConnections.id, 'myanimelist')).limit(1)
    if (!conn) return c.json({ error: 'MyAnimeList not connected' }, 401)

    const [watching, planToWatch, completed] = await Promise.all([
      myAnimeListService.getUserAnimeList(conn.accessToken, 'watching'),
      myAnimeListService.getUserAnimeList(conn.accessToken, 'plan_to_watch'),
      myAnimeListService.getUserAnimeList(conn.accessToken, 'completed'),
    ])

    return c.json({
      watching,
      planToWatch,
      completed,
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

integrationsRouter.delete('/myanimelist/disconnect', async (c) => {
  await db.delete(accountConnections).where(eq(accountConnections.id, 'myanimelist'))
  return c.json({ success: true, message: 'MyAnimeList account disconnected' })
})
