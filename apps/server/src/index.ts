import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { timing } from 'hono/timing'
import { etag } from 'hono/etag'
import { compress } from 'hono/compress'
import { trimTrailingSlash } from 'hono/trailing-slash'
import { prettyJSON } from 'hono/pretty-json'
import { bodyLimit } from 'hono/body-limit'
import { requestId } from 'hono/request-id'

import { config } from './config'
import { db } from './db'
import { users } from './db/schema'

// Modular Domain Routers
import { nuvioRouter } from './routes/nuvio'
import { badgesRouter } from './routes/badges'
import { metadataRouter } from './routes/metadata'
import { catalogsRouter } from './routes/catalogs'
import { debridRouter } from './routes/debrid'
import { postersRouter } from './routes/posters'
import { integrationsRouter } from './routes/integrations'
import { progressRouter } from './routes/progress'
import { streamingProvidersRouter } from './routes/streaming-providers'
import { avatarsRouter } from './routes/avatars'
import { proxyRouter } from './routes/proxy'
import { subtitlesRouter } from './routes/subtitles'
import { streamBridgeRouter } from './routes/stream-bridge'
import { animeRouter } from './routes/anime'
import { addonManagerRouter } from './routes/addon-manager'
import { customListsRouter } from './routes/custom-lists'
import { coverStudioRouter, coverSetsPopularityRouter } from './routes/cover-studio'
import { verifyRouter } from './routes/verify'
import { profileRouter } from './routes/profile'
import { supportRouter } from './routes/support'
import { statusRouter } from './routes/status'

const app = new Hono()

// --- Core Hono Middleware Suite ---
// 1. Request Tracing
app.use('*', requestId())

// 2. Performance & Timing Metrics
app.use('*', timing())

// 3. Structured Logging
app.use('*', logger())

// 4. Security Headers (CSP, HSTS, no-sniff, etc.)
app.use('*', secureHeaders())

// 5. Cross-Origin Resource Sharing
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'apikey', 'X-Requested-With'],
    exposeHeaders: ['Server-Timing', 'X-Request-Id', 'ETag', 'Content-Length'],
  })
)

// 6. Trailing slash normalization (/api/nuvio/profiles/ -> /api/nuvio/profiles)
app.use('*', trimTrailingSlash())

// 7. Pretty JSON formatting with ?pretty query flag
app.use('*', prettyJSON())

// 8. Automatic ETag generation for cacheable responses (manifests, catalogs, badges)
app.use('*', etag())

// 9. Response compression (gzip/deflate for large catalog arrays & badge sets)
app.use('*', compress())

// 10. Payload size safety limit (10MB)
app.use(
  '*',
  bodyLimit({
    maxSize: 10 * 1024 * 1024,
    onError: (c) => c.json({ error: 'Payload size exceeded 10MB limit' }, 413),
  })
)

// --- Server Health & Diagnostics ---
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    name: 'Nuviodeck Core Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    hono: {
      timing: true,
      compression: true,
      etag: true,
      secureHeaders: true,
      requestId: c.get('requestId'),
    },
    domains: {
      nuvio: '/api/nuvio',
      badges: '/api/badges',
      metadata: '/api/metadata',
      catalogs: '/api/catalogs',
      debrid: '/api/debrid',
      posters: '/api/posters',
      integrations: '/api/integrations',
      progress: '/api/progress',
      streamingProviders: '/api/streaming-providers',
      avatars: '/api/avatars',
      streamBridge: '/api/stream-bridge',
      anime: '/api/anime',
      addonManager: '/api/addon-manager',
      customLists: '/api/custom-lists',
      coverStudio: '/api/cover-studio',
      coverSets: '/api/cover-sets',
      verify: '/api/verify',
      profile: '/api/profile',
      support: '/api/support',
      status: '/api/status',
    },
  })
})

// --- Clean Isolated Domain Mounts ---
// 1. Nuvio Ecosystem (Auth, Profiles, Addons, Collections, Sync)
app.route('/api/nuvio', nuvioRouter)

// 2. Badges & Xperience Signature Packs
app.route('/api/badges', badgesRouter)

// 3. Metadata & Scrapers (TMDB, IMDb, Trakt)
app.route('/api/metadata', metadataRouter)

// 4. Catalogs & Stremio/Nuvio Manifest Engine
app.route('/api/catalogs', catalogsRouter)

// 5. Debrid & Streams (Real-Debrid, Torbox, etc.)
app.route('/api/debrid', debridRouter)

// 6. Posters & Visual Art Overlays
app.route('/api/posters', postersRouter)

// 7. User Account Integrations (TMDB, Trakt, Simkl, AniList, MAL)
app.route('/api/integrations', integrationsRouter)

// 8. Playback Tracking & Continue Watching
app.route('/api/progress', progressRouter)

// 9. Streaming Services & Regional Provider Matrix
app.route('/api/streaming-providers', streamingProvidersRouter)

// 10. Avatars Catalog
app.route('/api/avatars', avatarsRouter)

// 11. Byte-Range Video Streaming Proxy
app.route('/api/proxy', proxyRouter)

// 12. Subtitles Provider Engine
app.route('/api/subtitles', subtitlesRouter)

// 13. Stream Bridge & Multi-Scraper Debrid Hub
app.route('/api/stream-bridge', streamBridgeRouter)

// 14. Anime Compatibility & ID Translation Suite
app.route('/api/anime', animeRouter)

// 15. Addon Manager & Multi-Device Failover Engine
app.route('/api/addon-manager', addonManagerRouter)

// 16. Custom Lists & Live Catalog Resolvers
app.route('/api/custom-lists', customListsRouter)

// 17. Cover Studio Procedural Engine & Community Sets
app.route('/api/cover-studio', coverStudioRouter)
app.route('/api/cover-sets', coverSetsPopularityRouter)

// 18. Service Key Verification & AI Model Detection
app.route('/api/verify', verifyRouter)

// 19. Profile Discovery, Previews, AI Row Titles & Jellyfin
app.route('/api/profile', profileRouter)

// 20. Support Helpdesk & Threaded Tickets (Free for all)
app.route('/api/support', supportRouter)

// 21. Real-Time Service Status & Outage Incident Tracker
app.route('/api/status', statusRouter)

// Legacy / Users table endpoints
app.get('/api/users', async (c) => {
  try {
    const allUsers = await db.select().from(users)
    return c.json({ users: allUsers })
  } catch (error) {
    return c.json({ error: 'Failed to fetch users' }, 500)
  }
})

app.post('/api/users', async (c) => {
  try {
    const body = await c.req.json()
    if (!body.name || !body.email) {
      return c.json({ error: 'Name and email are required' }, 400)
    }

    const inserted = await db
      .insert(users)
      .values({
        name: body.name,
        email: body.email,
      })
      .returning()

    return c.json({ user: inserted[0] }, 201)
  } catch (error: any) {
    if (error?.message?.includes('UNIQUE')) {
      return c.json({ error: 'Email already exists' }, 400)
    }
    return c.json({ error: 'Failed to create user' }, 500)
  }
})

// Global 404 Handler
app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      path: c.req.path,
      method: c.req.method,
      requestId: c.get('requestId'),
    },
    404
  )
})

// Global Error Handler
app.onError((err, c) => {
  console.error(`[Unhandled Error] ${c.req.method} ${c.req.path}:`, err)
  const status = (err as any).status || 500
  return c.json(
    {
      error: err.message || 'Internal Server Error',
      requestId: c.get('requestId'),
      details: (err as any).details || undefined,
    },
    status
  )
})

export default {
  port: config.port,
  fetch: app.fetch,
}

export { app }
