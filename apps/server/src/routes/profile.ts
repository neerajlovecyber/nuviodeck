import { Hono } from 'hono'
import { AiSearchService } from '../services/ai-search'
import { CatalogResolver } from '../services/catalog-resolver'
import { db } from '../db'
import { deckProfiles, playbackSessions } from '../db/schema'
import { eq, desc } from 'drizzle-orm'

export const profileRouter = new Hono()

const catalogResolver = new CatalogResolver()
const aiSearchService = new AiSearchService()

/**
 * POST /api/profile/:id/ai-catalog-title
 * Generates an evocative 2-4 word title for an AI catalog row.
 * Extracted from BZI6vP8e.js
 */
profileRouter.post('/:id/ai-catalog-title', async (c) => {
  const profileId = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const prompt = (body.prompt || '').trim()
  const kind = (body.kind === 'series' ? 'series' : 'movie') as 'movie' | 'series'

  if (!prompt) {
    return c.json({ title: kind === 'movie' ? 'Curated Movies' : 'Curated Series' })
  }

  // Look up profile configuration for any user-configured AI keys or models
  let geminiKey: string | undefined
  let groqKey: string | undefined
  let deepseekKey: string | undefined
  let provider: string | undefined
  let model: string | undefined

  if (profileId) {
    const [prof] = await db
      .select()
      .from(deckProfiles)
      .where(eq(deckProfiles.id, profileId))
      .limit(1)

    if (prof?.configJson) {
      try {
        const parsed = JSON.parse(prof.configJson)
        provider = parsed.ai_provider || parsed.ai?.provider
        model = parsed.ai_model || parsed.ai?.model
        const keys = parsed.api_keys || {}
        geminiKey = keys.gemini || parsed.ai?.geminiKey
        groqKey = keys.groq || parsed.ai?.groqKey
        deepseekKey = keys.deepseek || parsed.ai?.deepseekKey
      } catch {}
    }
  }

  try {
    const title = await aiSearchService.generateCatalogTitle(prompt, kind, {
      provider,
      model,
      geminiKey,
      groqKey,
      deepseekKey,
    })
    return c.json({ title })
  } catch (err: any) {
    return c.json({ title: kind === 'movie' ? 'Curated Movies' : 'Curated Series' })
  }
})

/**
 * GET/POST /api/profile/:id/preview-catalog/:catalogId
 * Previews what items will appear in a catalog before saving it to a profile.
 */
profileRouter.get('/:id/preview-catalog/:catalogId', async (c) => {
  const profileId = c.req.param('id')
  const catalogId = decodeURIComponent(c.req.param('catalogId'))
  const type = (catalogId.includes('series') ? 'series' : 'movie') as 'movie' | 'series'

  try {
    const metas = await catalogResolver.resolveCatalog(catalogId, type, {
      profileId,
      page: 1,
    })
    return c.json({ metas: metas.slice(0, 40) })
  } catch (err: any) {
    return c.json({ metas: [], status: 'error', error: err.message }, 500)
  }
})

profileRouter.post('/:id/preview-catalog/:catalogId', async (c) => {
  const profileId = c.req.param('id')
  const catalogId = decodeURIComponent(c.req.param('catalogId'))
  const body = await c.req.json().catch(() => ({}))
  const type = (body.type || (catalogId.includes('series') ? 'series' : 'movie')) as 'movie' | 'series'

  try {
    const metas = await catalogResolver.resolveCatalog(catalogId, type, {
      profileId,
      page: 1,
      genre: body.genre,
      ...body,
    })
    return c.json({ metas: metas.slice(0, 40) })
  } catch (err: any) {
    return c.json({ metas: [], status: 'error', error: err.message }, 500)
  }
})

/**
 * POST /api/profile/:id/preview-merged
 * Previews combined multi-shelf rows
 */
profileRouter.post('/:id/preview-merged', async (c) => {
  const profileId = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const catalogIds: string[] = body.catalog_ids || body.catalogs || []
  const type = (body.type || 'movie') as 'movie' | 'series'

  try {
    if (catalogIds.length === 0) {
      return c.json({ metas: [] })
    }
    const mergedId = `merged:${catalogIds.join(',')}`
    const metas = await catalogResolver.resolveCatalog(mergedId, type, {
      profileId,
      page: 1,
    })
    return c.json({ metas: metas.slice(0, 40) })
  } catch (err: any) {
    return c.json({ metas: [], error: err.message }, 500)
  }
})

/**
 * GET /api/profile/:id/recent-watch-slots
 * Returns recent watch history slots for dynamic profile recommendations
 */
profileRouter.get('/:id/recent-watch-slots', async (c) => {
  const profileId = c.req.param('id')

  try {
    const recents = await db
      .select()
      .from(playbackSessions)
      .where(eq(playbackSessions.profileId, profileId))
      .orderBy(desc(playbackSessions.updatedAt))
      .limit(10)

    const slots = recents.map((s) => ({
      id: s.id,
      mediaId: s.mediaId,
      type: s.mediaType,
      title: s.title,
      progress: s.progressPercent ?? 0,
      duration: s.durationMs ?? 0,
      season: s.season,
      episode: s.episode,
      updatedAt: s.updatedAt,
    }))

    return c.json({ slots })
  } catch (err: any) {
    return c.json({ slots: [] })
  }
})

/**
 * POST /api/profile/import-fetch
 * Fetches remote addons or collections JSON
 */
profileRouter.post('/import-fetch', async (c) => {
  const body = await c.req.json().catch(() => ({}))

  if (body.collectionsUrl) {
    try {
      const res = await fetch(body.collectionsUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      return c.json({ collections: Array.isArray(data) ? data : data.collections || [] })
    } catch (err: any) {
      return c.json({ error: `Failed to fetch collections: ${err.message}` }, 400)
    }
  }

  if (Array.isArray(body.manifestUrls)) {
    const manifests = await Promise.all(
      body.manifestUrls.map(async (url: string) => {
        try {
          const res = await fetch(url)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          return { url, manifest: data }
        } catch (err: any) {
          return { url, error: err.message }
        }
      })
    )
    return c.json({ manifests })
  }

  return c.json({ error: 'Invalid import-fetch payload' }, 400)
})

/**
 * POST /api/profile/:id/manifest-key and rotate
 */
profileRouter.post('/:id/manifest-key', async (c) => {
  const id = c.req.param('id')
  return c.json({ key: `key-${id}-${Date.now().toString(36)}` })
})

profileRouter.post('/:id/manifest-key/rotate', async (c) => {
  const id = c.req.param('id')
  return c.json({ key: `key-${id}-${Date.now().toString(36)}` })
})

/**
 * Jellyfin integration endpoints for profile
 */
profileRouter.get('/:id/jellyfin', (c) => {
  const id = c.req.param('id')
  return c.json({
    configured: true,
    username: `deck-${id}`,
    serverUrl: `${new URL(c.req.url).origin}/api/jellyfin`,
  })
})

profileRouter.post('/:id/jellyfin/password', (c) => {
  const id = c.req.param('id')
  const pwd = `nuvio_${Math.random().toString(36).substring(2, 10)}`
  return c.json({
    configured: true,
    username: `deck-${id}`,
    password: pwd,
    serverUrl: `${new URL(c.req.url).origin}/api/jellyfin`,
  })
})

profileRouter.delete('/:id/jellyfin', (c) => {
  return c.json({ ok: true })
})
