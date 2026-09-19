import { Hono } from 'hono'
import { nuvioClient } from '../../lib/nuvio-client'
import { resolveAccessToken } from './auth'
import type { NuvioPushProfileInput } from '../../types/nuvio'

export const profilesRouter = new Hono()

// List all profiles (up to 6)
profilesRouter.get('/', async (c) => {
  try {
    const token = await resolveAccessToken(c)
    const profiles = await nuvioClient.pullProfiles(token)
    return c.json({ profiles })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Failed to fetch profiles', details: err.details },
      err.status || 500
    )
  }
})

// Full replace profiles (p_client_max_profiles: 6)
profilesRouter.put('/', async (c) => {
  try {
    const token = await resolveAccessToken(c)
    const body = await c.req.json()
    const profiles: NuvioPushProfileInput[] = body.profiles
    const maxProfiles = body.clientMaxProfiles || 6

    if (!Array.isArray(profiles)) {
      return c.json({ error: 'profiles array is required' }, 400)
    }

    await nuvioClient.pushProfiles(token, profiles, maxProfiles)
    const updated = await nuvioClient.pullProfiles(token)
    return c.json({ success: true, profiles: updated })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Failed to update profiles', details: err.details },
      err.status || 500
    )
  }
})

// Safely update a single profile (preserves other profile slots)
profilesRouter.patch('/:profileIndex', async (c) => {
  try {
    const token = await resolveAccessToken(c)
    const profileIndex = Number(c.req.param('profileIndex'))
    if (isNaN(profileIndex) || profileIndex < 1 || profileIndex > 6) {
      return c.json({ error: 'Valid profileIndex (1-6) is required' }, 400)
    }

    const updates = await c.req.json()
    const updatedProfiles = await nuvioClient.updateSingleProfile(
      token,
      profileIndex,
      updates
    )

    const updatedProfile = updatedProfiles.find(
      (p) => p.profile_index === profileIndex
    )
    return c.json({ success: true, profile: updatedProfile, profiles: updatedProfiles })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Failed to update profile', details: err.details },
      err.status || 500
    )
  }
})

// Dedicated atomic Avatar update for a profile
profilesRouter.patch('/:profileIndex/avatar', async (c) => {
  try {
    const token = await resolveAccessToken(c)
    const profileIndex = Number(c.req.param('profileIndex'))
    if (isNaN(profileIndex) || profileIndex < 1 || profileIndex > 6) {
      return c.json({ error: 'Valid profileIndex (1-6) is required' }, 400)
    }

    const body = await c.req.json()
    const { avatar_id, avatar_url, avatar_color_hex } = body

    const updatedProfiles = await nuvioClient.updateSingleProfile(
      token,
      profileIndex,
      {
        avatar_id,
        avatar_url,
        avatar_color_hex,
      }
    )

    const updatedProfile = updatedProfiles.find(
      (p) => p.profile_index === profileIndex
    )
    return c.json({
      success: true,
      message: `Updated avatar for profile ${profileIndex}`,
      profile: updatedProfile,
      profiles: updatedProfiles,
    })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Failed to update avatar', details: err.details },
      err.status || 500
    )
  }
})

// Get avatar catalog from Nuvio (public endpoint)
profilesRouter.get('/catalog/all', async (c) => {
  try {
    const catalog = await nuvioClient.getAvatarCatalog()
    return c.json({ catalog })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Failed to load avatar catalog', details: err.details },
      err.status || 500
    )
  }
})
