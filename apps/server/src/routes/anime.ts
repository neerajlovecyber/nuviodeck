import { Hono } from 'hono'
import { AnimeFillerService } from '../services/anime/filler-checker'
import { KitsuResolverService } from '../services/anime/kitsu-resolver'
import { getCustomEpisodeGroup, getCustomImdbId } from '../services/episode-groups'
import { idResolverService } from '../services/metadata/id-resolver'

export const animeRouter = new Hono()

/**
 * GET /api/anime/config
 * Returns decoded Xperience anime configuration options and defaults
 */
animeRouter.get('/config', (c) => {
  return c.json({
    anime_metadata_source: {
      options: ['tvdb', 'tmdb', 'kitsu'],
      default: 'tvdb',
      labels: { tvdb: 'TheTVDB', tmdb: 'TMDB', kitsu: 'Kitsu' },
    },
    anime_stream_id_source: {
      options: ['imdb', 'kitsu'],
      default: 'imdb',
      labels: { imdb: 'IMDb (tt2098220:2:49)', kitsu: 'Kitsu (kitsu:6448:107)' },
    },
    anime_episode_numbering: {
      options: ['absolute', 'seasonal'],
      default: 'absolute',
      labels: { absolute: 'Absolute (1137)', seasonal: 'Seasonal (S22E52)' },
    },
    anime_filler_marking: {
      options: ['off', 'tag'],
      default: 'off',
      labels: { off: 'Off', tag: 'Tag ([Filler])' },
    },
    anime_title_language: {
      options: ['default', 'romaji'],
      default: 'default',
      labels: { default: 'Default (English)', romaji: 'Romaji (Japanese)' },
    },
    series_metadata_source: {
      options: ['tvdb', 'tmdb'],
      default: 'tvdb',
      labels: { tvdb: 'TheTVDB (matches stream numbering)', tmdb: 'TMDB' },
    },
  })
})

/**
 * GET /api/anime/filler
 * Query filler status for an anime show and episode
 * Example: /api/anime/filler?title=Naruto%20Shippuden&episode=101
 */
animeRouter.get('/filler', async (c) => {
  const title = c.req.query('title')
  const episodeStr = c.req.query('episode')

  if (!title) {
    return c.json({ error: 'title query parameter is required' }, 400)
  }

  if (episodeStr) {
    const epNum = parseInt(episodeStr, 10)
    const epInfo = await AnimeFillerService.checkEpisode(title, epNum)
    return c.json({
      title,
      episode: epNum,
      filler: epInfo?.status === 'Filler',
      status: epInfo?.status || 'Unknown',
      episodeTitle: epInfo?.title || '',
    })
  }

  const fullData = await AnimeFillerService.getFillerData(title)
  if (!fullData) {
    return c.json({ title, found: false, episodes: [] }, 404)
  }

  const episodesList = Array.from(fullData.episodes.values())
  const fillerCount = episodesList.filter((e) => e.status === 'Filler').length

  return c.json({
    title: fullData.title,
    slug: fullData.slug,
    found: true,
    totalEpisodes: episodesList.length,
    fillerCount,
    fillerPercentage: episodesList.length ? Math.round((fillerCount / episodesList.length) * 100) : 0,
    episodes: episodesList,
  })
})

/**
 * GET /api/anime/kitsu/:id
 * Retrieve Kitsu metadata by numeric ID
 */
animeRouter.get('/kitsu/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10)
  if (isNaN(id)) {
    return c.json({ error: 'Valid numeric Kitsu ID is required' }, 400)
  }

  const meta = await KitsuResolverService.getKitsuAnime(id)
  if (!meta) {
    return c.json({ error: 'Anime not found on Kitsu' }, 404)
  }

  return c.json(meta)
})

/**
 * GET /api/anime/search
 * Search Kitsu by title query
 */
animeRouter.get('/search', async (c) => {
  const query = c.req.query('q')
  if (!query) {
    return c.json({ error: 'Query parameter q is required' }, 400)
  }

  const result = await KitsuResolverService.searchKitsu(query)
  if (!result) {
    return c.json({ error: 'No results found on Kitsu' }, 404)
  }

  return c.json(result)
})

/**
 * POST /api/anime/resolve-id
 * Resolves and translates anime query identifiers between IMDb, Kitsu, and TMDB.
 * Supports absolute episode mapping and custom divergence dictionaries.
 * 
 * Body: { id: string, type: 'movie' | 'series', season?: number, episode?: number, streamIdSource?: 'imdb' | 'kitsu' }
 */
animeRouter.post('/resolve-id', async (c) => {
  try {
    const { id, type = 'series', season, episode, streamIdSource = 'imdb' } = await c.req.json().catch(() => ({}))

    if (!id) {
      return c.json({ error: 'id is required' }, 400)
    }

    let tmdbId: string | null = null
    let imdbId: string | null = null
    let kitsuId: number | null = null

    // Parse input ID
    if (id.startsWith('tt')) {
      imdbId = id
    } else if (id.startsWith('kitsu:')) {
      const parts = id.split(':')
      kitsuId = parseInt(parts[1], 10)
    } else if (id.startsWith('tmdb:')) {
      tmdbId = id.replace('tmdb:', '')
    } else if (/^\d+$/.test(id)) {
      tmdbId = id
    }

    // Resolve TMDB <-> IMDb mapping via Metadata Resolver
    const resolved = await idResolverService.resolve(id, type)
    if (resolved.imdbId) imdbId = resolved.imdbId
    if (resolved.tmdbId) tmdbId = String(resolved.tmdbId)
    if (resolved.kitsuId) kitsuId = resolved.kitsuId

    // Check custom IMDb overrides (e.g. Dragon Ball Z)
    if (tmdbId) {
      const customImdb = getCustomImdbId(tmdbId)
      if (customImdb) {
        imdbId = customImdb
      }
    }

    // Check custom episode group overrides (e.g. One Piece, Naruto Shippuden)
    const customGroup = tmdbId ? getCustomEpisodeGroup(tmdbId) : undefined

    // Resolve Kitsu ID if needed for stream query
    if (streamIdSource === 'kitsu' && !kitsuId) {
      const kitsuMeta = await KitsuResolverService.searchKitsu(id)
      if (kitsuMeta) {
        kitsuId = kitsuMeta.kitsuId
      }
    }

    // Build the canonical stream query ID matching scraper conventions
    let streamQueryId = id
    if (streamIdSource === 'kitsu' && kitsuId) {
      streamQueryId = episode !== undefined ? `kitsu:${kitsuId}:${episode}` : `kitsu:${kitsuId}`
    } else if (imdbId) {
      if (season !== undefined && episode !== undefined) {
        streamQueryId = `${imdbId}:${season}:${episode}`
      } else {
        streamQueryId = imdbId
      }
    }

    return c.json({
      originalId: id,
      type,
      tmdbId,
      imdbId,
      kitsuId,
      streamQueryId,
      streamIdSource,
      hasCustomEpisodeGroup: !!customGroup,
      customEpisodeGroupId: customGroup?.episodeGroupId,
      watchOrderOnly: customGroup?.watchOrderOnly || false,
    })
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to resolve anime ID' }, 500)
  }
})
