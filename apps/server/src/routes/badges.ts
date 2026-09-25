import { Hono } from 'hono'
import { nuvioClient } from '../lib/nuvio-client'
import { resolveAccessToken } from './nuvio/auth'
import { badgesEngineService } from '../services/badges'

export const badgesRouter = new Hono()

// List all badge set presets
badgesRouter.get('/presets', async (c) => {
  const sets = await badgesEngineService.getBadgeSets()
  const summaries = sets.map((s) => ({
    id: s.id,
    label: s.label,
    creator: s.creator,
    style: s.style,
    description: s.description,
    signature: s.signature,
    badgeCount: s.badgeCount || s.badges?.length || 0,
    groups: s.groups,
  }))
  return c.json({ presets: summaries })
})

// Get a specific badge set
badgesRouter.get('/presets/:presetId', async (c) => {
  const presetId = c.req.param('presetId')
  const found = await badgesEngineService.getBadgeSetById(presetId)
  if (!found) {
    return c.json({ error: `Badge set ${presetId} not found` }, 404)
  }
  return c.json({ preset: found })
})

// Resolve specific badge image URL
badgesRouter.get('/resolve/:presetId/:ratingKey', async (c) => {
  const presetId = c.req.param('presetId')
  const ratingKey = c.req.param('ratingKey')
  const imageUrl = await badgesEngineService.resolveBadgeImageUrl(presetId, ratingKey)
  if (!imageUrl) {
    return c.json({ error: `Badge not found for key ${ratingKey} in preset ${presetId}` }, 404)
  }
  return c.json({ presetId, ratingKey, imageUrl })
})

// Real-time stream title badge parser (evaluated on TV / Web preview)
badgesRouter.post('/parse', async (c) => {
  const { presetId, title } = await c.req.json().catch(() => ({}))
  if (!presetId || !title) {
    return c.json({ error: 'presetId and title are required' }, 400)
  }

  const matches = await badgesEngineService.parseStreamTitle(presetId, title)
  return c.json({
    presetId,
    title,
    count: matches.length,
    matches,
  })
})

// Public export endpoint returning raw JSON ready for Nuvio TV / Mobile Settings -> Badges import
badgesRouter.get('/export/:presetId', async (c) => {
  const presetParam = c.req.param('presetId') || ''
  const presetId = presetParam.replace(/\.json$/, '')
  const found = await badgesEngineService.getBadgeSetById(presetId)

  if (!found) {
    return c.json({ error: `Badge set ${presetId} not found` }, 404)
  }

  // Format compatible with Nuvio's badge pack format
  const exportPayload = {
    id: found.id,
    name: found.label,
    author: found.creator,
    description: found.description || '',
    version: '1.0.0',
    groups: found.groups || [],
    badges: found.badges || [],
  }

  c.header('Content-Type', 'application/json')
  c.header('Access-Control-Allow-Origin', '*')
  return c.json(exportPayload)
})

// Push active badge set config directly to Nuvio profile settings
badgesRouter.post('/sync/:profileIndex', async (c) => {
  try {
    const token = await resolveAccessToken(c)
    const profileIndex = Number(c.req.param('profileIndex'))
    const { presetId, badgeUrl, platform = 'tv' } = await c.req.json()

    if (!presetId && !badgeUrl) {
      return c.json({ error: 'presetId or badgeUrl is required' }, 400)
    }

    // Pull current profile settings blob
    const currentSettings = await nuvioClient.pullProfileSettings(
      token,
      profileIndex,
      platform
    )
    const baseSettings = currentSettings[0]?.settings_json || {}

    // Update badge configuration in settings blob
    const updatedSettings = {
      ...baseSettings,
      badges: {
        active_preset: presetId,
        url: badgeUrl,
        updated_at: new Date().toISOString(),
      },
    }

    await nuvioClient.pushProfileSettings(
      token,
      profileIndex,
      platform,
      updatedSettings
    )

    return c.json({
      success: true,
      message: `Pushed badge preset ${presetId} to profile ${profileIndex} settings`,
      settings: updatedSettings,
    })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Failed to sync badges to Nuvio', details: err.details },
      err.status || 500
    )
  }
})
