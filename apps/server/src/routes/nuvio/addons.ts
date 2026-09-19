import { Hono } from 'hono'
import { nuvioClient } from '../../lib/nuvio-client'
import { resolveAccessToken } from './auth'
import type { NuvioPushAddonInput } from '../../types/nuvio'

export const addonsRouter = new Hono()

// List addons for profile
addonsRouter.get('/:profileIndex', async (c) => {
  try {
    const token = await resolveAccessToken(c)
    const profileIndex = Number(c.req.param('profileIndex'))
    const addons = await nuvioClient.listAddons(token, profileIndex)
    return c.json({ profileIndex, addons })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Failed to fetch addons', details: err.details },
      err.status || 500
    )
  }
})

// Full replace addons for profile
addonsRouter.put('/:profileIndex', async (c) => {
  try {
    const token = await resolveAccessToken(c)
    const profileIndex = Number(c.req.param('profileIndex'))
    const { addons } = await c.req.json()

    if (!Array.isArray(addons)) {
      return c.json({ error: 'addons array is required' }, 400)
    }

    await nuvioClient.pushAddons(token, profileIndex, addons)
    const updated = await nuvioClient.listAddons(token, profileIndex)
    return c.json({ success: true, profileIndex, addons: updated })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Failed to replace addons', details: err.details },
      err.status || 500
    )
  }
})

// Append or update single addon
addonsRouter.post('/:profileIndex', async (c) => {
  try {
    const token = await resolveAccessToken(c)
    const profileIndex = Number(c.req.param('profileIndex'))
    const body: NuvioPushAddonInput = await c.req.json()

    if (!body.url) {
      return c.json({ error: 'Addon url is required' }, 400)
    }

    const updated = await nuvioClient.appendOrUpdateAddon(token, profileIndex, body)
    return c.json({ success: true, profileIndex, addons: updated })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Failed to append addon', details: err.details },
      err.status || 500
    )
  }
})

// Toggle addon enabled/disabled status
addonsRouter.patch('/:profileIndex/toggle', async (c) => {
  try {
    const token = await resolveAccessToken(c)
    const profileIndex = Number(c.req.param('profileIndex'))
    const { url, enabled } = await c.req.json()

    if (!url) {
      return c.json({ error: 'url is required to toggle addon' }, 400)
    }

    const existing = await nuvioClient.listAddons(token, profileIndex)
    const target = existing.find((a) => a.url === url)
    if (!target) {
      return c.json({ error: 'Addon not found' }, 404)
    }

    const nextState = enabled !== undefined ? enabled : !target.enabled
    const updatedList: NuvioPushAddonInput[] = existing.map((a) => ({
      url: a.url,
      name: a.name,
      enabled: a.url === url ? nextState : a.enabled,
      sort_order: a.sort_order,
    }))

    await nuvioClient.pushAddons(token, profileIndex, updatedList)
    const fresh = await nuvioClient.listAddons(token, profileIndex)
    return c.json({ success: true, profileIndex, addons: fresh })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Failed to toggle addon', details: err.details },
      err.status || 500
    )
  }
})

// Delete single addon by URL without wiping out others
addonsRouter.delete('/:profileIndex', async (c) => {
  try {
    const token = await resolveAccessToken(c)
    const profileIndex = Number(c.req.param('profileIndex'))
    const { url } = await c.req.json()

    if (!url) {
      return c.json({ error: 'url is required to delete addon' }, 400)
    }

    const existing = await nuvioClient.listAddons(token, profileIndex)
    const remaining: NuvioPushAddonInput[] = existing
      .filter((a) => a.url !== url)
      .map((a, idx) => ({
        url: a.url,
        name: a.name,
        enabled: a.enabled,
        sort_order: idx,
      }))

    await nuvioClient.pushAddons(token, profileIndex, remaining)
    const fresh = await nuvioClient.listAddons(token, profileIndex)
    return c.json({ success: true, profileIndex, addons: fresh })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Failed to delete addon', details: err.details },
      err.status || 500
    )
  }
})
