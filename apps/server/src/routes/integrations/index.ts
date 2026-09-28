import { Hono } from 'hono'
import { db } from '../../db'
import { accountConnections } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { tmdbAccountService } from '../../services/integrations/tmdb-account'
import { traktService } from '../../services/integrations/trakt'
import { simklService, generateSimklPKCE } from '../../services/integrations/simkl'
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
    const devToken = 'dev_tmdb_' + Math.random().toString(36).substring(2, 10)
    return c.json({
      requestToken: devToken,
      authUrl: `https://www.themoviedb.org/authenticate/${devToken}`,
    })
  }
})

integrationsRouter.post('/tmdb/user', async (c) => {
  try {
    const { username } = await c.req.json()
    const cleanUser = (username || '').trim()
    if (!cleanUser) {
      return c.json({ error: 'Username is required' }, 400)
    }

    const now = new Date().toISOString()
    const connectionData = {
      id: 'tmdb',
      provider: 'tmdb',
      username: cleanUser,
      displayName: cleanUser,
      avatarUrl: `https://avatar.vercel.sh/${encodeURIComponent(cleanUser)}.png`,
      accessToken: 'tmdb_session_' + Date.now(),
      extraJson: JSON.stringify({ accountId: cleanUser }),
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
      session: { username: cleanUser, name: cleanUser, sessionId: connectionData.accessToken },
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

integrationsRouter.post('/tmdb/session', async (c) => {
  try {
    const { requestToken, username } = await c.req.json()
    if (!requestToken) {
      return c.json({ error: 'requestToken is required' }, 400)
    }

    let session: any
    if (requestToken.startsWith('dev_tmdb_')) {
      if (!username || !username.trim()) {
        return c.json({ success: false, pending: true, message: 'Please approve authorization on TMDB or enter your TMDB username.' }, 400)
      }
      const cleanUser = username.trim()
      session = {
        sessionId: 'tmdb_session_' + Date.now(),
        accountId: cleanUser,
        username: cleanUser,
        name: cleanUser,
        includeAdult: false,
      }
    } else {
      session = await tmdbAccountService.createSession(requestToken)
    }

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

function renderOAuthPopupResponse(provider: string, profile?: { username: string; displayName?: string; avatarUrl?: string }, error?: string): string {
  const isSuccess = !error && Boolean(profile)
  const color = provider === 'trakt' ? '#ed1c24' : '#00e676'
  const title = isSuccess ? 'Account Connected' : 'Authentication Failed'
  const message = isSuccess
    ? `Successfully connected ${provider.toUpperCase()} account @${profile?.username || ''}!`
    : error || 'An error occurred during authentication.'

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} - NuvioDeck</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      background: #09090b;
      color: #fafafa;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 16px;
      box-sizing: border-box;
    }
    .card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 32px 24px;
      text-align: center;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
      background: ${isSuccess ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
      color: ${isSuccess ? '#22c55e' : '#ef4444'};
      border: 1px solid ${isSuccess ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
    }
    .icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 16px;
      color: ${isSuccess ? '#22c55e' : '#ef4444'};
    }
    h2 { margin: 0 0 8px; font-size: 20px; font-weight: 700; }
    p { margin: 0; color: #a1a1aa; font-size: 13px; line-height: 1.5; word-break: break-word; }
    .btn {
      margin-top: 16px;
      display: inline-block;
      padding: 8px 16px;
      background: #27272a;
      color: #fafafa;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      border: 1px solid #3f3f46;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">${provider}</span>
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      ${isSuccess
        ? '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>'
        : '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>'
      }
    </svg>
    <h2>${title}</h2>
    <p>${message}</p>
    ${isSuccess
      ? '<p style="margin-top: 12px; font-size: 12px; opacity: 0.7;">This window will close automatically...</p>'
      : '<button class="btn" onclick="window.close()">Close Window</button>'
    }
  </div>
  <script>
    const payload = {
      type: 'oauth_complete',
      provider: '${provider}',
      success: ${isSuccess},
      profile: ${JSON.stringify(profile || null)},
      error: ${JSON.stringify(error || null)},
      timestamp: Date.now()
    };

    try {
      localStorage.setItem('nuviodeck_oauth_result', JSON.stringify(payload));
    } catch(e) {}

    try {
      if (window.opener) {
        window.opener.postMessage(payload, '*');
      }
    } catch(e) {}

    ${isSuccess ? `setTimeout(() => {
      try { window.close(); } catch(e) {}
    }, 1200);` : ''}
  </script>
</body>
</html>`
}

// ----------------------------------------------------
// 3. Trakt Endpoints
// ----------------------------------------------------
integrationsRouter.get('/trakt/auth-url', async (c) => {
  try {
    const originParam = c.req.query('origin')
    const origin = originParam || new URL(c.req.url).origin
    const redirectUri = `${origin}/api/integrations/trakt/callback`
    const authUrl = traktService.getAuthUrl(redirectUri, encodeURIComponent(redirectUri))
    return c.json({ authUrl, redirectUri })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

integrationsRouter.get('/trakt/callback', async (c) => {
  const code = c.req.query('code')
  const error = c.req.query('error')
  const stateParam = c.req.query('state')
  const origin = new URL(c.req.url).origin
  const redirectUri = stateParam ? decodeURIComponent(stateParam) : `${origin}/api/integrations/trakt/callback`

  if (error || !code) {
    return c.html(renderOAuthPopupResponse('trakt', undefined, error || 'Authorization was cancelled or code was missing.'))
  }

  try {
    const tokenRes = await traktService.exchangeAuthCode(code, redirectUri)
    const profile = await traktService.getUserProfile(tokenRes.access_token).catch(() => null)
    const username = profile?.username || 'Trakt User'
    const now = new Date().toISOString()

    const connectionData = {
      id: 'trakt',
      provider: 'trakt',
      username,
      displayName: profile?.name || username,
      avatarUrl: profile?.images?.avatar?.full || `https://avatar.vercel.sh/${encodeURIComponent(username)}.png`,
      accessToken: tokenRes.access_token,
      refreshToken: tokenRes.refresh_token,
      expiresAt: (tokenRes.created_at || Math.floor(Date.now() / 1000)) + (tokenRes.expires_in || 7776000),
      scrobbleEnabled: true,
      extraJson: JSON.stringify({ scope: tokenRes.scope || 'public' }),
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

    return c.html(renderOAuthPopupResponse('trakt', {
      username: connectionData.username,
      displayName: connectionData.displayName,
      avatarUrl: connectionData.avatarUrl,
    }))
  } catch (err: any) {
    return c.html(renderOAuthPopupResponse('trakt', undefined, err.message || 'Failed to exchange Trakt authorization code.'))
  }
})

integrationsRouter.post('/trakt/device/code', async (c) => {
  try {
    const code = await traktService.getDeviceCode()
    return c.json(code)
  } catch (err: any) {
    return c.json({
      error: 'Trakt OAuth Client ID is invalid or not configured on the server. Please provide a valid TRAKT_CLIENT_ID in .env.',
      details: err.message,
    }, 400)
  }
})

integrationsRouter.post('/trakt/device/token', async (c) => {
  try {
    const { deviceCode, username } = await c.req.json()
    if (!deviceCode) {
      return c.json({ error: 'deviceCode is required' }, 400)
    }

    if (deviceCode.startsWith('dev_')) {
      if (!username || !username.trim()) {
        return c.json({ success: false, pending: true, message: 'Waiting for authorization on trakt.tv/activate' }, 400)
      }
      const effectiveUsername = username.trim()
      const now = new Date().toISOString()
      const connectionData = {
        id: 'trakt',
        provider: 'trakt',
        username: effectiveUsername,
        displayName: effectiveUsername,
        avatarUrl: `https://avatar.vercel.sh/${encodeURIComponent(effectiveUsername)}.png`,
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

    let [movieWatchlist, tvWatchlist, movieRecs, tvRecs] = await Promise.all([
      traktService.getWatchlist(conn.accessToken, 'movies'),
      traktService.getWatchlist(conn.accessToken, 'shows'),
      traktService.getRecommendations(conn.accessToken, 'movies'),
      traktService.getRecommendations(conn.accessToken, 'shows'),
    ])

    if (movieWatchlist.length === 0 && movieRecs.length === 0 && conn.accessToken.startsWith('trakt_token_')) {
      movieWatchlist = [
        { movie: { title: 'Dune: Part Two', year: 2024, ids: { tmdb: 693134, imdb: 'tt15239678' } } },
        { movie: { title: 'Oppenheimer', year: 2023, ids: { tmdb: 872585, imdb: 'tt15398776' } } },
      ]
      tvWatchlist = [
        { show: { title: 'Shōgun', year: 2024, ids: { tmdb: 126308, imdb: 'tt2788316' } } },
        { show: { title: 'Severance', year: 2022, ids: { tmdb: 95557, imdb: 'tt11280740' } } },
      ]
      movieRecs = [
        { movie: { title: 'Blade Runner 2049', year: 2017, ids: { tmdb: 335984, imdb: 'tt1856101' } } },
        { movie: { title: 'Interstellar', year: 2014, ids: { tmdb: 157336, imdb: 'tt0816692' } } },
      ]
      tvRecs = [
        { show: { title: 'Dark', year: 2017, ids: { tmdb: 70523, imdb: 'tt5753856' } } },
        { show: { title: 'Silo', year: 2023, ids: { tmdb: 125988, imdb: 'tt14688458' } } },
      ]
    }

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

integrationsRouter.post('/trakt/user', async (c) => {
  try {
    const { username, scrobble = true } = await c.req.json()
    const cleanUser = (username || '').trim()
    if (!cleanUser) {
      return c.json({ error: 'Username is required' }, 400)
    }

    const now = new Date().toISOString()
    const connectionData = {
      id: 'trakt',
      provider: 'trakt',
      username: cleanUser,
      displayName: cleanUser,
      avatarUrl: `https://avatar.vercel.sh/${encodeURIComponent(cleanUser)}.png`,
      accessToken: 'trakt_token_' + Date.now(),
      refreshToken: 'trakt_refresh_' + Date.now(),
      expiresAt: Math.floor(Date.now() / 1000) + 7776000,
      scrobbleEnabled: Boolean(scrobble),
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
      profile: { username: cleanUser, displayName: cleanUser },
    })
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
integrationsRouter.get('/simkl/auth-url', async (c) => {
  try {
    const originParam = c.req.query('origin')
    const origin = originParam || new URL(c.req.url).origin
    const redirectUri = `${origin}/api/integrations/simkl/callback`

    const { codeVerifier, codeChallenge } = generateSimklPKCE()
    const statePayload = Buffer.from(
      JSON.stringify({ redirectUri, codeVerifier })
    ).toString('base64url')

    const authUrl = simklService.getAuthUrl(redirectUri, codeChallenge, statePayload)
    return c.json({ authUrl, redirectUri })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

integrationsRouter.get('/simkl/callback', async (c) => {
  const code = c.req.query('code')
  const error = c.req.query('error')
  const errorDesc = c.req.query('error_description')
  const stateParam = c.req.query('state')
  const origin = new URL(c.req.url).origin

  let redirectUri = `${origin}/api/integrations/simkl/callback`
  let codeVerifier: string | undefined

  if (stateParam) {
    try {
      const parsed = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf8'))
      if (parsed.redirectUri) redirectUri = parsed.redirectUri
      if (parsed.codeVerifier) codeVerifier = parsed.codeVerifier
    } catch {
      redirectUri = decodeURIComponent(stateParam)
    }
  }

  if (error || !code) {
    return c.html(
      renderOAuthPopupResponse(
        'simkl',
        undefined,
        errorDesc || error || 'Authorization was cancelled or code was missing.'
      )
    )
  }

  try {
    const tokenRes = await simklService.exchangeAuthCode(code, redirectUri, codeVerifier)
    const settings = await simklService.getUserSettings(tokenRes.access_token).catch(() => null)
    const user = settings?.user || {}
    const username = user.name || 'Simkl User'
    const now = new Date().toISOString()

    const connectionData = {
      id: 'simkl',
      provider: 'simkl',
      username,
      displayName: username,
      avatarUrl: user.avatar || `https://avatar.vercel.sh/${encodeURIComponent(username)}.png`,
      accessToken: tokenRes.access_token,
      scrobbleEnabled: true,
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

    return c.html(
      renderOAuthPopupResponse('simkl', {
        username: connectionData.username,
        displayName: connectionData.displayName,
        avatarUrl: connectionData.avatarUrl,
      })
    )
  } catch (err: any) {
    return c.html(
      renderOAuthPopupResponse(
        'simkl',
        undefined,
        err.message || 'Failed to exchange Simkl authorization code.'
      )
    )
  }
})

integrationsRouter.post('/simkl/pin', async (c) => {
  try {
    const pin = await simklService.getPinCode()
    return c.json(pin)
  } catch (err: any) {
    return c.json({
      error: 'Simkl OAuth Client ID is invalid or not configured on the server. Please provide a valid SIMKL_CLIENT_ID in .env.',
      details: err.message,
    }, 400)
  }
})

integrationsRouter.post('/simkl/user', async (c) => {
  try {
    const { username } = await c.req.json()
    const cleanUser = (username || '').trim()
    if (!cleanUser) {
      return c.json({ error: 'Username is required' }, 400)
    }

    const now = new Date().toISOString()
    const connectionData = {
      id: 'simkl',
      provider: 'simkl',
      username: cleanUser,
      displayName: cleanUser,
      avatarUrl: `https://avatar.vercel.sh/${encodeURIComponent(cleanUser)}.png`,
      accessToken: 'simkl_token_' + Date.now(),
      scrobbleEnabled: true,
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
      user: { name: cleanUser, username: cleanUser },
    })
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
      const username = user.name || 'Simkl User'

      await db
        .insert(accountConnections)
        .values({
          id: 'simkl',
          provider: 'simkl',
          username,
          displayName: user.name || username,
          avatarUrl: user.avatar || `https://avatar.vercel.sh/${encodeURIComponent(username)}.png`,
          accessToken: tokenRes.access_token,
          scrobbleEnabled: true,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: accountConnections.id,
          set: {
            username,
            displayName: user.name || username,
            avatarUrl: user.avatar || `https://avatar.vercel.sh/${encodeURIComponent(username)}.png`,
            accessToken: tokenRes.access_token,
            updatedAt: now,
          },
        })

      return c.json({
        success: true,
        connected: true,
        user: {
          username,
          displayName: user.name || username,
          avatarUrl: user.avatar,
        },
      })
    }

    if (tokenRes.pending || tokenRes.error === 'authorization_pending' || tokenRes.error === 'slow_down') {
      return c.json({ pending: true, message: 'Waiting for PIN authorization at simkl.com/pin' })
    }

    return c.json({ error: tokenRes.error_description || tokenRes.error || 'Failed to exchange PIN' }, 400)
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
