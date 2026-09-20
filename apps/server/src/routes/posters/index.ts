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
    providers: [
      { id: 'custom', name: 'Custom URL', type: 'url', placeholder: 'https://proxy.com/{type}/{id}.jpg', supportsEpisodeStills: true },
      { id: 'betterposters', name: 'BetterPosters', type: 'url', configureUrl: 'https://btttr.cc', placeholder: 'https://btttr.cc/config/token' },
      { id: 'easyrating', name: 'EasyRatings (ERDB)', type: 'url', configureUrl: 'https://easyratingsdb.com', placeholder: 'https://easyratingsdb.com/...', supportsEpisodeStills: true },
      { id: 'topposters', name: 'Top Posters', type: 'key', configureUrl: 'https://top-streaming.stream', placeholder: 'topposters api key', supportsEpisodeStills: true },
      { id: 'rpdb', name: 'RPDB', type: 'key', configureUrl: 'https://ratingposterdb.com', placeholder: 'rpdb api key' },
      { id: 'omdb', name: 'OMDb', type: 'key', configureUrl: 'https://omdbapi.com/apikey.aspx', placeholder: 'omdb api key' },
      { id: 'fanart', name: 'Fanart.tv', type: 'key', configureUrl: 'https://fanart.tv/get-an-api-key', placeholder: 'fanart api key' },
      { id: 'xrdb', name: 'XRDB', type: 'url', configureUrl: 'https://xrdb.ibbylabs.dev', placeholder: 'https://xrdb-host or poster url', supportsEpisodeStills: true },
      { id: 'postersplus', name: 'Posters+', type: 'url', configureUrl: 'https://postersplus.elfhosted.com', placeholder: 'posters+ poster url', supportsEpisodeStills: true },
    ],
    defaultOrder: [
      'custom',
      'betterposters',
      'easyrating',
      'topposters',
      'rpdb',
      'omdb',
      'fanart',
      'xrdb',
      'postersplus',
    ],
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
