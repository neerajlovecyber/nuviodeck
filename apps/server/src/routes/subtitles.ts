import { Hono } from 'hono'
import { SubtitlesBridgeService } from '../services/subtitles'
import { db } from '../db'
import { deckProfiles } from '../db/schema'
import { eq } from 'drizzle-orm'

export const subtitlesRouter = new Hono()
const subtitlesBridgeService = new SubtitlesBridgeService()

/**
 * Subtitles Provider Engine
 * GET /api/subtitles/:type/:id/:extra?.json
 * Matches Stremio and Nuvio Subtitles API specifications.
 */
subtitlesRouter.get('/:type/:id/:extra?', async (c) => {
  const type = (c.req.param('type') === 'series' ? 'series' : 'movie') as 'movie' | 'series'
  let id = c.req.param('id')
  const extraRaw = c.req.param('extra')
  const profileId = c.req.query('profileId')

  // Parse extra query / path segments (e.g. videoHash=...&videoSize=... or lang=en)
  const extraParams: Record<string, string> = {}
  if (extraRaw) {
    const cleanExtra = extraRaw.replace(/\.json$/, '')
    const pairs = cleanExtra.split('&')
    for (const pair of pairs) {
      const [k, v] = pair.split('=')
      if (k && v) extraParams[decodeURIComponent(k)] = decodeURIComponent(v)
    }
  }

  // Also include URL search params
  const urlObj = new URL(c.req.url)
  for (const [k, v] of urlObj.searchParams.entries()) {
    if (k !== 'profileId') extraParams[k] = v
  }

  // Anime ID translation: if kitsu:1234:5, extract or translate ID
  if (id.startsWith('kitsu:')) {
    // E.g. kitsu:1234:5 -> if subtitle sources require IMDb tt...
    // Look up translated stream ID or keep kitsu fallback
    const parts = id.split(':')
    if (parts.length >= 2) {
      // In Nuviodeck, anime translation service resolves kitsu to imdb if needed
    }
  }

  // Load profile configuration if available
  let subtitleConfig: any = undefined
  if (profileId) {
    try {
      const [prof] = await db
        .select()
        .from(deckProfiles)
        .where(eq(deckProfiles.id, profileId))
        .limit(1)

      if (prof?.configJson) {
        const parsed = JSON.parse(prof.configJson)
        if (parsed.subtitle_bridge) {
          subtitleConfig = {
            addons: parsed.subtitle_bridge.addons,
            preferences: parsed.subtitle_bridge.preferences,
            timeout_ms: parsed.subtitle_bridge.timeout_ms,
          }
        }
      }
    } catch {}
  }

  try {
    const subs = await subtitlesBridgeService.fetchSubtitles(type, id, extraParams, subtitleConfig)

    c.header('Content-Type', 'application/json')
    c.header('Access-Control-Allow-Origin', '*')
    c.header('Cache-Control', 'max-age=3600, public')

    return c.json({
      subtitles: subs.map((s) => ({
        id: s.id,
        url: s.url,
        lang: s.lang,
        label: s.label || s.lang,
      })),
    })
  } catch (err: any) {
    console.error('[Subtitles Bridge Error]:', err.message)
    return c.json({ subtitles: [] })
  }
})
