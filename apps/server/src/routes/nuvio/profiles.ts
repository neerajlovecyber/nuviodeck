import { Hono } from 'hono'
import { nuvioClient } from '../../lib/nuvio-client'
import { resolveAccessToken } from './auth'
import type { NuvioPushProfileInput } from '../../types/nuvio'

export const NUVIO_CATALOG_MAP: Record<string, string> = {
  avatar_lalo: "animals/bram-v1.png",
  avatar_lara: "animals/clover-v1.png",
  avatar_levi: "animals/pip-v1.png",
  avatar_mikasa: "animals/otto-v1.png",
  avatar_naruto: "animals/milo-v1.png",
  avatar_negan: "animals/miso-v1.png",
  avatar_neo: "animals/elio-v1.png",
  avatar_rick_grimes: "animals/finn-v1.png",
  avatar_saitama: "animals/poppy-v1.png",
  avatar_saul_goodman: "animals/bao-v1.png",
  avatar_linear_woman_teal: "avatar_linear_teal_v3.png",
  avatar_linear_man_purple: "avatar_linear_purple_v3.png",
  avatar_linear_woman_red: "avatar_linear_red_v3.png",
  avatar_linear_man_navy: "avatar_linear_navy_v3.png",
  avatar_linear_woman_yellow: "avatar_linear_yellow_v3.png",
  avatar_linear_man_green: "avatar_linear_green_v3.png",
  avatar_linear_woman_pink: "avatar_linear_pink_v3.png",
  avatar_aang: "originals/nova-v1.png",
  avatar_arthur_morgan: "originals/bolt-v1.png",
  avatar_ash: "originals/marina-v1.png",
  avatar_chihiro: "originals/shadow-v1.png",
  avatar_daenerys: "originals/rook-v1.png",
  avatar_dexter: "originals/riff-v1.png",
  avatar_eleven: "originals/clue-v1.png",
  avatar_eren: "originals/cedar-v1.png",
  avatar_furiosa: "originals/ruby-v1.png",
  avatar_geralt: "originals/sage-v1.png",
  avatar_gojo: "portraits/quinn-v1.png",
  avatar_goku: "portraits/iris-v1.png",
  avatar_harry_potter: "portraits/ari-v1.png",
  avatar_jack_sparrow: "portraits/hugo-v1.png",
  avatar_jinwoo: "portraits/skye-v1.png",
  avatar_joel: "portraits/maya-v1.png",
  avatar_jon_snow: "portraits/drew-v1.png",
  avatar_katara: "portraits/leo-v1.png",
  avatar_killua: "portraits/zia-v1.png",
  avatar_kratos: "portraits/elle-v1.png",
  avatar_tommy_shelby: "sketches/rowan-v1.png",
  avatar_v: "sketches/silas-v1.png",
  avatar_walter_white: "sketches/nico-v1.png",
  avatar_wednesday: "sketches/violet-v1.png",
  avatar_moss: "sketches/moss-v1.png",
}

export function resolveNuvioAvatar(avatarId?: string | null, avatarUrl?: string | null): string | null {
  if (avatarUrl) return avatarUrl
  if (!avatarId) return null
  const storagePath = NUVIO_CATALOG_MAP[avatarId]
  if (storagePath) {
    return `https://api.nuvio.tv/storage/v1/object/public/avatars/${storagePath}`
  }
  return null
}

export const profilesRouter = new Hono()

// List all profiles (up to 6)
profilesRouter.get('/', async (c) => {
  try {
    const token = await resolveAccessToken(c)
    const rawProfiles = await nuvioClient.pullProfiles(token)
    const profiles = rawProfiles.map((p) => ({
      ...p,
      avatar_url: resolveNuvioAvatar(p.avatar_id, p.avatar_url),
    }))
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
