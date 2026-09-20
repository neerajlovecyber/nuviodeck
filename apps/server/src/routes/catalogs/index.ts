import { Hono } from 'hono'
import { db } from '../../db'
import { deckProfiles } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { TmdbService } from '../../services/tmdb'
import { CatalogResolver, getCatalogRegistry } from '../../services/catalog-resolver'
import { streamAggregatorService } from '../../services/streams'
import { StreamsProfileConfig } from '../../services/streams/types'

export const catalogsRouter = new Hono()

const resolver = new CatalogResolver()

// Helper to extract profile configuration options
async function getProfileConfig(profileId?: string) {
  if (!profileId || profileId === 'default') {
    return {
      name: 'Nuviodeck Curated',
      rows: [],
      options: {},
    }
  }

  try {
    const found = await db.query.deckProfiles.findFirst({
      where: eq(deckProfiles.id, profileId),
    })

    if (!found || !found.configJson) {
      return {
        name: found?.name || 'Nuviodeck Profile',
        rows: [],
        options: {},
      }
    }

    const cfg = JSON.parse(found.configJson)
    const rows = cfg.rows || cfg.selectedRows || []
    
    return {
      name: found.name,
      rows,
      options: {
        tmdbToken: cfg.integrations?.tmdbToken,
        mdblistKey: cfg.integrations?.mdbListKey,
        geminiKey: cfg.ai?.apiKey || cfg.ai?.geminiApiKey,
        groqKey:
          cfg.ai?.groqApiKey ||
          cfg.ai?.groqKey ||
          (cfg.ai?.provider?.toLowerCase().includes('groq') ? cfg.ai?.apiKey : undefined),
        aiModel:
          cfg.ai?.model ||
          (cfg.ai?.provider?.toLowerCase().includes('groq')
            ? 'openai/gpt-oss-120b'
            : 'gemini-3.5-flash-lite'),
        aiProvider: cfg.ai?.provider || 'gemini',
        enableAiRecs: cfg.ai?.enableAiRecs ?? true,
        enableAiSearch: cfg.ai?.enableAiSearch ?? true,
        rpdbKey: cfg.posters?.rpdbKey || cfg.posters?.providers?.rpdb?.key,
        posterConfig: cfg.posters,
        language: cfg.preferences?.language || 'en-US',
        fallbackLanguage: cfg.preferences?.fallbackLanguage || 'en',
        timezone: cfg.preferences?.timezone || 'auto',
        hideAdult: cfg.preferences?.hideAdult ?? true,
        excludeUnreleased: cfg.preferences?.excludeUnreleased ?? false,
        moviesDigitalOnly: cfg.preferences?.moviesDigitalOnly ?? false,
        ageRating: cfg.preferences?.ageRating || 'NONE',
        maxRating: cfg.preferences?.maxRating || cfg.preferences?.ageRating || 'any',
        qualityFloor: cfg.preferences?.qualityFloor || 'any',
        originCountries: cfg.preferences?.originCountries,
        excludeCountries: cfg.preferences?.excludeCountries,
        hideWatched: cfg.preferences?.hideWatched ?? false,
        hideCaughtUp: cfg.preferences?.hideCaughtUp ?? false,
        seriesEpisodeSource: cfg.preferences?.seriesEpisodeSource || 'tvdb',
        animeEpisodeSource: cfg.preferences?.animeEpisodeSource || 'tvdb',
        animeNumbering: cfg.preferences?.animeNumbering || 'standard',
        animeStreamId: cfg.preferences?.animeStreamId || 'imdb',
        animeTitles: cfg.preferences?.animeTitles || 'default',
        fillerEpisodes: cfg.preferences?.fillerEpisodes || 'tag',
        region: cfg.preferences?.region || 'United States',
        proxyUrl: cfg.preferences?.proxyUrl || cfg.integrations?.proxyUrl,
      },
      streams: (cfg.streams || {
        enabled: false,
        sources: [
          { id: 'comet_torbox', name: 'Comet', type: 'comet', enabled: true, debridService: 'torbox' },
          { id: 'stremthru_torbox', name: 'StremThru Torz', type: 'stremthru', enabled: true, debridService: 'torbox' },
          { id: 'comet_rd', name: 'Comet', type: 'comet', enabled: true, debridService: 'realdebrid' },
          { id: 'stremthru_rd', name: 'StremThru Torz', type: 'stremthru', enabled: true, debridService: 'realdebrid' },
        ],
        debridKeys: {
          torbox: cfg.debrid?.torbox?.apiKey || cfg.debrid?.torboxKey || '',
          realdebrid: cfg.debrid?.realdebrid?.apiKey || cfg.debrid?.realDebridKey || '',
          alldebrid: cfg.debrid?.alldebrid?.apiKey || cfg.debrid?.allDebridKey || '',
          premiumize: cfg.debrid?.premiumize?.apiKey || cfg.debrid?.premiumizeKey || '',
          debridlink: cfg.debrid?.debridlink?.apiKey || cfg.debrid?.debridLinkKey || '',
        },
        filters: {
          mostPerResolution: 10,
          excludedQualities: ['CAM', 'TS', 'SCR'],
        },
        mergeStrategy: 'priority',
        formatter: {
          preset: 'prism',
          viewMode: 'full',
        },
      }) as StreamsProfileConfig,
    }
  } catch (err: any) {
    console.error('Error fetching profile config:', err.message)
    return {
      name: 'Nuviodeck Profile',
      rows: [],
      options: {},
      streams: { enabled: false, sources: [] } as StreamsProfileConfig,
    }
  }
}

// ----------------------------------------------------
// 1. Manifest Endpoints
// ----------------------------------------------------

function buildManifest(
  profileId: string,
  profileName: string,
  rows: any[],
  streamsEnabled: boolean = false
) {
  const defaultCatalogs = [
    {
      type: 'movie',
      id: 'trending_movies',
      name: 'Trending Movies',
      extra: [{ name: 'skip' }, { name: 'search' }],
    },
    {
      type: 'series',
      id: 'trending_series',
      name: 'Trending Series',
      extra: [{ name: 'skip' }, { name: 'search' }],
    },
    {
      type: 'movie',
      id: 'snoak_top100_movies',
      name: 'Top 100 Movies Today',
      extra: [{ name: 'skip' }],
    },
    {
      type: 'series',
      id: 'snoak_top100_series',
      name: 'Top 100 TV Today',
      extra: [{ name: 'skip' }],
    },
  ]

  const customCatalogs = rows.map((r: any) => ({
    type: r.type === 'both' ? 'movie' : r.type || 'movie',
    id: r.id,
    name: r.name,
    extra: [{ name: 'skip' }, { name: 'search' }],
  }))

  const resources = ['catalog', 'meta']
  if (streamsEnabled) {
    resources.push('stream')
  }

  return {
    id: `org.nuviodeck.${profileId || 'default'}`,
    version: '1.2.0',
    name: `Nuviodeck: ${profileName}`,
    description: `Curated multi-source catalog and playback engine for Nuvio & Stremio`,
    resources,
    types: streamsEnabled ? ['movie', 'series', 'anime'] : ['movie', 'series'],
    idPrefixes: streamsEnabled ? ['tmdb:', 'tt', 'kitsu:'] : ['tmdb:', 'tt'],
    catalogs: customCatalogs.length > 0 ? customCatalogs : defaultCatalogs,
  }
}

// Global default manifest
catalogsRouter.get('/manifest.json', (c) => {
  const manifest = buildManifest('deck', 'Curated Engine', [], false)
  c.header('Content-Type', 'application/json')
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Cache-Control', 'max-age=3600, public')
  return c.json(manifest)
})

// Per-profile dynamic manifest
catalogsRouter.get('/:profileId/manifest.json', async (c) => {
  const profileId = c.req.param('profileId')
  const { name, rows, streams } = await getProfileConfig(profileId)
  const manifest = buildManifest(profileId, name, rows, streams?.enabled ?? false)
  c.header('Content-Type', 'application/json')
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Cache-Control', 'max-age=1800, public')
  return c.json(manifest)
})

// ----------------------------------------------------
// Catalog Registry & Categories (Single Source of Truth)
// ----------------------------------------------------

// Full catalog registry with items and categories
catalogsRouter.get('/registry', (c) => {
  const registry = getCatalogRegistry()
  c.header('Content-Type', 'application/json')
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Cache-Control', 'max-age=3600, stale-while-revalidate=86400, public')
  return c.json(registry)
})

// Lightweight category directory
catalogsRouter.get('/registry/categories', (c) => {
  const registry = getCatalogRegistry()
  c.header('Content-Type', 'application/json')
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Cache-Control', 'max-age=3600, stale-while-revalidate=86400, public')
  return c.json({
    total: registry.total,
    categories: registry.categoryDirectory,
  })
})

// ----------------------------------------------------
// 2. Catalog Row Endpoints
// ----------------------------------------------------

async function handleCatalogRequest(
  profileId: string | undefined,
  type: string,
  catalogId: string,
  extraString: string | undefined,
  queryMap: Record<string, string>
) {
  try {
    const { options } = await getProfileConfig(profileId)

    // Parse extra string (e.g., skip=20&search=batman)
    let skip = queryMap.skip ? parseInt(queryMap.skip, 10) : 0
    let search = queryMap.search || ''
    let genre = queryMap.genre || ''

    if (extraString) {
      const params = new URLSearchParams(extraString.replace(/\.json$/, ''))
      if (params.get('skip')) skip = parseInt(params.get('skip')!, 10)
      if (params.get('search')) search = params.get('search')!
      if (params.get('genre')) genre = params.get('genre')!
    }

    const page = Math.floor(skip / 20) + 1
    const cleanType = type === 'series' ? 'series' : 'movie'
    const cleanCatalogId = catalogId.replace(/\.json$/, '')

    const metas = await resolver.resolveCatalog(cleanCatalogId, cleanType, {
      page,
      profileId,
      search,
      genre,
      ...options,
    })

    return { metas: metas || [] }
  } catch (err: any) {
    console.error(`Catalog resolution error for "${catalogId}":`, err.message)
    return { metas: [] }
  }
}

// Standalone catalog route: /catalog/:type/:id/:extra?.json
catalogsRouter.get('/catalog/:type/:id/:extra?', async (c) => {
  const type = c.req.param('type')
  const id = c.req.param('id')
  const extra = c.req.param('extra')
  const queries = c.req.query()

  const result = await handleCatalogRequest(undefined, type, id, extra, queries)
  c.header('Content-Type', 'application/json')
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Cache-Control', 'max-age=600, public')
  return c.json(result)
})

// Profile catalog route: /:profileId/catalog/:type/:id/:extra?
catalogsRouter.get('/:profileId/catalog/:type/:id/:extra?', async (c) => {
  const profileId = c.req.param('profileId')
  const type = c.req.param('type')
  const id = c.req.param('id')
  const extra = c.req.param('extra')
  const queries = c.req.query()

  const result = await handleCatalogRequest(profileId, type, id, extra, queries)
  c.header('Content-Type', 'application/json')
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Cache-Control', 'max-age=600, public')
  return c.json(result)
})

// ----------------------------------------------------
// 3. Metadata Detail Endpoints
// ----------------------------------------------------

async function handleMetaRequest(profileId: string | undefined, type: string, rawId: string) {
  try {
    const { options } = await getProfileConfig(profileId)
    const tmdb = new TmdbService({
      apiToken: options.tmdbToken,
      language: options.language,
      rpdbKey: options.rpdbKey,
      posterConfig: options.posterConfig,
      proxyUrl: options.proxyUrl,
    })

    const isMovie = type === 'movie'
    const cleanId = rawId.replace(/\.json$/, '')

    let numericTmdbId: number | null = null

    // If format is tmdb:12345
    if (cleanId.startsWith('tmdb:')) {
      numericTmdbId = parseInt(cleanId.replace('tmdb:', ''), 10)
    }
    // If format is IMDb tt1234567
    else if (cleanId.startsWith('tt')) {
      const findRes = await tmdb.findByExternalId(cleanId, 'imdb_id')
      const match = isMovie ? findRes.movie_results?.[0] : findRes.tv_results?.[0]
      if (match) {
        numericTmdbId = match.id
      }
    }
    // Otherwise parse numeric ID directly
    else if (/^\d+$/.test(cleanId)) {
      numericTmdbId = parseInt(cleanId, 10)
    }

    if (!numericTmdbId) {
      return { meta: null }
    }

    const details = isMovie
      ? await tmdb.getMovieDetails(numericTmdbId, options.language)
      : await tmdb.getTvDetails(numericTmdbId, options.language)

    const meta = await tmdb.formatFullMeta(details, isMovie ? 'movie' : 'series', {
      rpdbKey: options.rpdbKey,
      posterConfig: options.posterConfig,
      animeTitles: options.animeTitles,
      animeNumbering: options.animeNumbering,
      animeStreamId: options.animeStreamId,
      fillerEpisodes: options.fillerEpisodes,
    })

    return { meta }
  } catch (err: any) {
    console.error(`Meta resolution error for "${rawId}":`, err.message)
    return { meta: null }
  }
}

// Standalone meta route: /meta/:type/:id
catalogsRouter.get('/meta/:type/:id', async (c) => {
  const type = c.req.param('type')
  const id = c.req.param('id')
  const result = await handleMetaRequest(undefined, type, id)
  c.header('Content-Type', 'application/json')
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Cache-Control', 'max-age=3600, public')
  return c.json(result)
})

// Profile meta route: /:profileId/meta/:type/:id
catalogsRouter.get('/:profileId/meta/:type/:id', async (c) => {
  const profileId = c.req.param('profileId')
  const type = c.req.param('type')
  const id = c.req.param('id')
  const result = await handleMetaRequest(profileId, type, id)
  c.header('Content-Type', 'application/json')
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Cache-Control', 'max-age=3600, public')
  return c.json(result)
})

// ----------------------------------------------------
// 5. Streams Endpoints (Stremio Protocol)
// ----------------------------------------------------

async function handleStreamRequest(
  profileId: string | undefined,
  type: string,
  rawId: string
) {
  const cleanId = rawId.endsWith('.json') ? rawId.slice(0, -5) : rawId
  const { streams } = await getProfileConfig(profileId)

  if (!streams || !streams.enabled) {
    return { streams: [] }
  }

  const results = await streamAggregatorService.getStreams(
    type,
    cleanId,
    streams,
    profileId
  )

  return { streams: results }
}

// Standalone stream route: /stream/:type/:id
catalogsRouter.get('/stream/:type/:id', async (c) => {
  const type = c.req.param('type')
  const id = c.req.param('id')
  const result = await handleStreamRequest(undefined, type, id)
  c.header('Content-Type', 'application/json')
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Cache-Control', 'no-cache')
  return c.json(result)
})

// Profile stream route: /:profileId/stream/:type/:id
catalogsRouter.get('/:profileId/stream/:type/:id', async (c) => {
  const profileId = c.req.param('profileId')
  const type = c.req.param('type')
  const id = c.req.param('id')
  const result = await handleStreamRequest(profileId, type, id)
  c.header('Content-Type', 'application/json')
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Cache-Control', 'no-cache')
  return c.json(result)
})

