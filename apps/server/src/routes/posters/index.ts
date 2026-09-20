import { Hono } from 'hono'
import { posterEngineService } from '../../services/posters'

export const postersRouter = new Hono()

// Health and status endpoint
postersRouter.get('/status', (c) => {
  return c.json({
    status: 'ok',
    engine: 'Multi-Provider Poster Engine',
    features: [
      'user_drag_drop_priority',
      'ratings_on_posters',
      'badged_episode_stills',
      'live_provider_verify',
      '9_supported_providers',
    ],
    providersCount: 9,
  })
})

// Supported Poster Providers directory matching Xperience suite
postersRouter.get('/providers', (c) => {
  return c.json({
    providers: posterEngineService.getProvidersList(),
    defaultOrder: posterEngineService.getDefaultOrder(),
    options: {
      showRatingsOnPosters: true,
      ratingBadgedEpisodeStills: true,
    },
  })
})

// Verify provider key / URL (powers "Verify" button in UI)
postersRouter.post('/verify', async (c) => {
  try {
    const { provider, keyOrUrl } = await c.req.json()
    if (!provider || !keyOrUrl) {
      return c.json({ error: 'provider and keyOrUrl are required' }, 400)
    }

    const result = await posterEngineService.verifyProvider(provider, keyOrUrl)
    return c.json(result, result.valid ? 200 : 400)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Resolve dynamic poster or episode still
postersRouter.post('/resolve', async (c) => {
  try {
    const body = await c.req.json()
    const { posterPath, stillPath, tmdbId, imdbId, type, season, episode, config: userConfig } = body

    const posterUrl = posterEngineService.getPosterUrl(posterPath, {
      tmdbId,
      imdbId,
      type: type || 'movie',
      config: userConfig,
    })

    const stillUrl = stillPath || (season && episode)
      ? posterEngineService.getEpisodeStillUrl(stillPath, {
          tmdbId,
          season,
          episode,
          config: userConfig,
        })
      : null

    return c.json({
      posterUrl,
      stillUrl,
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Backward-compatible render endpoint
postersRouter.get('/render', (c) => {
  const tmdbId = c.req.query('tmdbId')
  if (!tmdbId) {
    return c.json({ error: 'tmdbId is required' }, 400)
  }
  return c.json({
    tmdbId,
    posterUrl: posterEngineService.getPosterUrl(null, { tmdbId: Number(tmdbId) }),
  })
})
