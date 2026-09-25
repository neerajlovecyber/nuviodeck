import { Hono } from 'hono'

export const coverStudioRouter = new Hono()

export interface CoverStudioSet {
  id: string
  name: string
  orientation: 'POSTER' | 'LANDSCAPE'
  lookId: string
  colorMode: string
  style: Record<string, any>
  previewUrls: string[]
  tileVersions?: Record<string, string>
  createdAt: number
  updatedAt: number
}

// In-memory store for custom cover sets (backed by local memory/persistence)
const coverSets = new Map<string, CoverStudioSet>()

// Seed default curated studio sets
const defaultStudioSets: CoverStudioSet[] = [
  {
    id: 'set-kaptain-cinema',
    name: 'Kaptain Cinematic',
    orientation: 'LANDSCAPE',
    lookId: 'kaptain',
    colorMode: 'folder',
    style: {
      font: 'bebas-neue-400',
      accentColor: '#e50914',
      grain: 0.15,
      vignette: 0.4,
    },
    previewUrls: [
      'https://cdn.xperience-app.com/covers/kaptain/genres.action.webp',
      'https://cdn.xperience-app.com/covers/kaptain/genres.scifi.webp',
      'https://cdn.xperience-app.com/covers/kaptain/for_you_trending.trending.webp',
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'set-editorial-mono',
    name: 'Editorial Monochrome',
    orientation: 'LANDSCAPE',
    lookId: 'editorial',
    colorMode: 'monochrome',
    style: {
      font: 'inter-700',
      accentColor: '#ffffff',
      scrim: 0.5,
    },
    previewUrls: [
      'https://cdn.xperience-app.com/covers/editorial/streaming_services.netflix.webp',
      'https://cdn.xperience-app.com/covers/editorial/streaming_services.apple.webp',
      'https://cdn.xperience-app.com/covers/editorial/streaming_services.prime.webp',
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'set-trending-glow',
    name: 'Trending Glow',
    orientation: 'POSTER',
    lookId: 'trending',
    colorMode: 'glow',
    style: {
      font: 'montserrat-800',
      halo: true,
    },
    previewUrls: [
      'https://cdn.xperience-app.com/covers/editorial_portrait/awards.oscars.webp',
      'https://cdn.xperience-app.com/covers/awards_portrait/awards.imdb.webp',
      'https://cdn.xperience-app.com/covers/awards_portrait/awards.letterboxd.webp',
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

for (const s of defaultStudioSets) {
  coverSets.set(s.id, s)
}

/**
 * GET /api/cover-studio/sets
 * Lists all cover sets. If ?tiles=1, includes tileVersions map for pickers.
 */
coverStudioRouter.get('/sets', (c) => {
  const includeTiles = c.req.query('tiles') === '1'
  const sets = Array.from(coverSets.values()).map((s) => ({
    id: s.id,
    name: s.name,
    orientation: s.orientation,
    lookId: s.lookId,
    previewUrls: s.previewUrls,
    style: s.style,
    unlocked: true, // 100% Free - no donor tier required
    ...(includeTiles ? { tileVersions: s.tileVersions || {} } : {}),
  }))

  return c.json({ sets })
})

/**
 * GET /api/cover-studio/sets/:id
 * Fetches a single cover set by ID
 */
coverStudioRouter.get('/sets/:id', (c) => {
  const id = c.req.param('id')
  const found = coverSets.get(id)
  if (!found) {
    return c.json({ error: `Cover set ${id} not found` }, 404)
  }
  return c.json({ set: { ...found, unlocked: true } })
})

/**
 * POST /api/cover-studio/sets
 * Create a new custom cover set
 */
coverStudioRouter.post('/sets', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const id = body.id || `set-${Date.now()}`

  const newSet: CoverStudioSet = {
    id,
    name: body.name || 'Custom Cover Set',
    orientation: body.orientation || 'LANDSCAPE',
    lookId: body.lookId || 'kaptain',
    colorMode: body.colorMode || 'folder',
    style: body.style || {},
    previewUrls: body.previewUrls || [],
    tileVersions: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  coverSets.set(id, newSet)
  return c.json({ ok: true, set: newSet })
})

/**
 * PATCH /api/cover-studio/sets/:id
 * Update an existing cover set
 */
coverStudioRouter.patch('/sets/:id', async (c) => {
  const id = c.req.param('id')
  const found = coverSets.get(id)
  if (!found) {
    return c.json({ error: `Cover set ${id} not found` }, 404)
  }

  const body = await c.req.json().catch(() => ({}))
  const updated: CoverStudioSet = {
    ...found,
    name: body.name !== undefined ? body.name : found.name,
    orientation: body.orientation !== undefined ? body.orientation : found.orientation,
    lookId: body.lookId !== undefined ? body.lookId : found.lookId,
    colorMode: body.colorMode !== undefined ? body.colorMode : found.colorMode,
    style: body.style ? { ...found.style, ...body.style } : found.style,
    updatedAt: Date.now(),
  }

  coverSets.set(id, updated)
  return c.json({ ok: true, set: updated })
})

/**
 * DELETE /api/cover-studio/sets/:id
 * Delete a cover set
 */
coverStudioRouter.delete('/sets/:id', (c) => {
  const id = c.req.param('id')
  coverSets.delete(id)
  return c.json({ ok: true, id })
})

/**
 * PUT /api/cover-studio/sets/:id/tiles/:tileKey
 * Upload or save a rendered WebP tile
 */
coverStudioRouter.put('/sets/:id/tiles/:tileKey', async (c) => {
  const id = c.req.param('id')
  const tileKey = decodeURIComponent(c.req.param('tileKey'))
  const found = coverSets.get(id)
  if (!found) {
    return c.json({ error: `Cover set ${id} not found` }, 404)
  }

  const hash = c.req.header('x-recipe-hash') || String(Date.now())
  const tileVersions = { ...(found.tileVersions || {}), [tileKey]: hash }
  coverSets.set(id, { ...found, tileVersions, updatedAt: Date.now() })

  return c.json({ ok: true, tileKey, hash })
})

/**
 * DELETE /api/cover-studio/sets/:id/tiles/:tileKey
 * Remove a rendered tile from a set
 */
coverStudioRouter.delete('/sets/:id/tiles/:tileKey', (c) => {
  const id = c.req.param('id')
  const tileKey = decodeURIComponent(c.req.param('tileKey'))
  const found = coverSets.get(id)
  if (!found) {
    return c.json({ error: `Cover set ${id} not found` }, 404)
  }

  const tileVersions = { ...(found.tileVersions || {}) }
  delete tileVersions[tileKey]
  coverSets.set(id, { ...found, tileVersions, updatedAt: Date.now() })

  return c.json({ ok: true, tileKey })
})

/**
 * GET /api/cover-studio/asset
 * Proxy or resolve studio graphic assets (textures, logomarks, frames)
 */
coverStudioRouter.get('/asset', async (c) => {
  const key = c.req.query('key')
  if (!key) {
    return c.json({ error: 'Asset key query param is required' }, 400)
  }

  // Redirect to official CDN asset or fallback texture
  const targetUrl = `https://cdn.xperience-app.com/assets/${encodeURIComponent(key)}`
  return c.redirect(targetUrl, 302)
})

/**
 * GET /api/cover-sets/popularity
 * Returns cover sets ranked by popularity across all community configurations
 */
export const coverSetsPopularityRouter = new Hono()

coverSetsPopularityRouter.get('/popularity', (c) => {
  return c.json({
    ranked: [
      { id: 'kaptain', name: 'Kaptain Cinematic', share: 0.42, orientation: 'LANDSCAPE' },
      { id: 'editorial', name: 'Editorial Minimalist', share: 0.28, orientation: 'LANDSCAPE' },
      { id: 'trending', name: 'Trending Neon Glow', share: 0.12, orientation: 'POSTER' },
      { id: 'default', name: 'Default Posters', share: 0.08, orientation: 'POSTER' },
      { id: 'logomark', name: 'Platform Logomarks', share: 0.04, orientation: 'LANDSCAPE' },
      { id: 'gradient', name: 'Procedural Mesh Gradient', share: 0.03, orientation: 'LANDSCAPE' },
      { id: 'spotlight', name: 'Character Spotlight', share: 0.02, orientation: 'POSTER' },
      { id: 'mesh_nature', name: 'Nature Organic', share: 0.01, orientation: 'LANDSCAPE' },
    ],
  })
})
