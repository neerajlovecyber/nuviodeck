import { TmdbService } from './tmdb'
import { MdbListService } from './mdblist'
import { AiSearchService } from './ai-search'
import { isMovieReleasedDigitally } from './release-filter'
import { db } from '../db'
import { accountConnections, playbackSessions } from '../db/schema'
import { eq } from 'drizzle-orm'
import { tmdbAccountService } from './integrations/tmdb-account'
import { traktService } from './integrations/trakt'
import { playbackTrackerService } from './playback-tracker'

export interface CatalogResolveOptions {
  page?: number
  profileId?: string
  genre?: string
  search?: string
  tmdbToken?: string
  mdblistKey?: string
  geminiKey?: string
  groqKey?: string
  aiModel?: string
  aiProvider?: string
  enableAiRecs?: boolean
  enableAiSearch?: boolean
  rpdbKey?: string
  posterConfig?: any
  language?: string
  fallbackLanguage?: string
  timezone?: string
  hideAdult?: boolean
  excludeUnreleased?: boolean
  moviesDigitalOnly?: boolean
  ageRating?: string
  maxRating?: string
  qualityFloor?: 'any' | 'good' | 'great'
  originCountries?: string | string[]
  excludeCountries?: string | string[]
  hideWatched?: boolean
  hideCaughtUp?: boolean
  seriesEpisodeSource?: 'tvdb' | 'tmdb'
  animeEpisodeSource?: 'tvdb' | 'tmdb' | 'kitsu' | 'anilist'
  animeNumbering?: 'absolute' | 'standard'
  animeStreamId?: 'imdb' | 'kitsu' | 'tmdb'
  animeTitles?: 'default' | 'romaji' | 'japanese'
  fillerEpisodes?: 'tag' | 'hide' | 'normal'
  region?: string
  proxyUrl?: string
}

// Map popular streaming provider IDs in TMDB
const STREAMING_PROVIDER_MAP: Record<string, number> = {
  netflix: 8,
  prime: 9,
  disney: 337,
  apple: 350,
  hbo: 1899,
  paramount: 531,
  crunchyroll: 283,
  hulu: 15,
}

// Map common genres to TMDB genre IDs
const GENRE_MAP: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  scifi: 878,
  thriller: 53,
  war: 10752,
  western: 37,
}

// Map studios to TMDB company IDs
const STUDIO_MAP: Record<string, number> = {
  a24: 41077,
  marvel: 420,
  pixar: 3,
  disney: 2,
  warner: 174,
  universal: 33,
  paramount: 4,
  sony: 34,
  ghibli: 10342,
  blumhouse: 3172,
}

// Helper to convert friendly country name to ISO 3166-1 alpha-2 code
function getCountryCode(regionName?: string): string {
  if (!regionName) return 'US'
  const map: Record<string, string> = {
    'United States': 'US',
    'United Kingdom': 'GB',
    'India': 'IN',
    'Brazil': 'BR',
    'Canada': 'CA',
    'Australia': 'AU',
    'France': 'FR',
    'Germany': 'DE',
    'Spain': 'ES',
    'Italy': 'IT',
    'Netherlands': 'NL',
    'Turkey': 'TR',
  }
  return map[regionName] || 'US'
}

import xperienceData from '../data/xperience-catalogs.json'

export interface XpCatalog {
  id: string
  label: string
  category: string
  kind: 'movie' | 'series'
  source?: string
  source_params?: Record<string, any>
  requires?: string[]
}

const xpCatalogMap = new Map<string, XpCatalog>()
for (const cat of (xperienceData.catalogs as XpCatalog[])) {
  xpCatalogMap.set(cat.id, cat)
}

export interface CatalogCategory {
  id: string
  name: string
  count: number
  items: Array<{
    id: string
    name: string
    category: string
    type: 'movie' | 'series' | 'both'
    source?: string
    requires?: string[]
    sourceParams?: Record<string, any>
  }>
}

export interface CatalogFilterOptions {
  category?: string
  kind?: 'movie' | 'series' | 'all'
  search?: string
  limit?: number
  offset?: number
}

export interface CuratedCatalogItem {
  id: string
  label: string
  category: string
  categoryLabel: string
  kind: 'movie' | 'series'
  source?: string
  sourceParams?: Record<string, any>
  requires: string[]
  personalized?: boolean
  tileShape?: 'POSTER' | 'LANDSCAPE' | 'SQUARE'
  coverSlug?: string
}

export function getCuratedCatalogs(filter?: CatalogFilterOptions): {
  total: number
  items: CuratedCatalogItem[]
  limit: number
  offset: number
} {
  const categoryLabelMap = (xperienceData.categoryLabels || {}) as Record<string, string>
  const limit = Math.min(filter?.limit ?? 50, 200)
  const offset = filter?.offset ?? 0

  let items: CuratedCatalogItem[] = (xperienceData.catalogs as any[]).map((c) => ({
    id: c.id,
    label: c.label,
    category: c.category,
    categoryLabel: categoryLabelMap[c.category] || c.category,
    kind: c.kind === 'series' ? 'series' : 'movie',
    source: c.source,
    sourceParams: c.source_params,
    requires: c.requires || [],
    personalized: Boolean(c.personalized),
    tileShape: c.category?.includes('collections') || c.category?.includes('streaming') ? 'LANDSCAPE' : 'POSTER',
    coverSlug: c.defaultCoverSlug || `${c.category}.${c.id}`,
  }))

  if (filter?.category) {
    const catClean = filter.category.toLowerCase()
    items = items.filter((i) => i.category.toLowerCase() === catClean || i.categoryLabel.toLowerCase() === catClean)
  }

  if (filter?.kind && filter.kind !== 'all') {
    items = items.filter((i) => i.kind === filter.kind)
  }

  if (filter?.search) {
    const q = filter.search.toLowerCase().trim()
    items = items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.categoryLabel.toLowerCase().includes(q)
    )
  }

  const total = items.length
  const paginated = items.slice(offset, offset + limit)

  return {
    total,
    items: paginated,
    limit,
    offset,
  }
}

export function getCuratedCategories(): Array<{ id: string; label: string; count: number }> {
  const categoryIdList = (xperienceData.categories || []) as string[]
  const categoryLabelMap = (xperienceData.categoryLabels || {}) as Record<string, string>
  const catalogs = (xperienceData.catalogs || []) as any[]

  return categoryIdList.map((catId) => ({
    id: catId,
    label: categoryLabelMap[catId] || catId,
    count: catalogs.filter((c) => c.category === catId).length,
  }))
}

export function getCuratedPresets(): Array<{
  id: string
  label: string
  hint: string
  rowCount: number
  rowIds: string[]
}> {
  const presets = (xperienceData.presets || []) as Array<{ id: string; label: string; hint: string }>
  const presetRows = (xperienceData.presetRows || {}) as Record<string, string[]>

  return presets.map((p) => {
    const rows = presetRows[p.id] || []
    return {
      ...p,
      rowCount: rows.length,
      rowIds: rows,
    }
  })
}

export function getCuratedPresetById(presetId: string): {
  preset: { id: string; label: string; hint: string }
  rows: CuratedCatalogItem[]
} | null {
  const presets = (xperienceData.presets || []) as Array<{ id: string; label: string; hint: string }>
  const presetRows = (xperienceData.presetRows || {}) as Record<string, string[]>
  const categoryLabelMap = (xperienceData.categoryLabels || {}) as Record<string, string>

  const found = presets.find((p) => p.id === presetId)
  if (!found) return null

  const rowIds = presetRows[presetId] || []
  const catalogList = (xperienceData.catalogs || []) as any[]
  const rowMap = new Map<string, any>(catalogList.map((c) => [c.id, c]))

  const rows: CuratedCatalogItem[] = rowIds
    .map((id) => rowMap.get(id))
    .filter(Boolean)
    .map((c) => ({
      id: c.id,
      label: c.label,
      category: c.category,
      categoryLabel: categoryLabelMap[c.category] || c.category,
      kind: c.kind === 'series' ? 'series' : 'movie',
      source: c.source,
      sourceParams: c.source_params,
      requires: c.requires || [],
      personalized: Boolean(c.personalized),
      tileShape: c.category?.includes('collections') || c.category?.includes('streaming') ? 'LANDSCAPE' : 'POSTER',
      coverSlug: c.defaultCoverSlug || `${c.category}.${c.id}`,
    }))

  return {
    preset: found,
    rows,
  }
}

export function getCatalogRegistry(): {
  total: number
  categories: CatalogCategory[]
  categoryDirectory: Array<{ id: string; name: string; count: number }>
  presets: Array<{ id: string; label: string; hint: string }>
  presetRows: Record<string, string[]>
} {
  const categoryIdList = (xperienceData.categories || []) as string[]
  const categoryLabelMap = (xperienceData.categoryLabels || {}) as Record<string, string>

  const items = (xperienceData.catalogs as XpCatalog[]).map((c) => ({
    id: c.id,
    name: c.label,
    category: categoryLabelMap[c.category] || c.category,
    type: (c.kind === 'series' ? 'series' : 'movie') as 'movie' | 'series',
    source: c.source,
    requires: c.requires || [],
    sourceParams: c.source_params || {},
  }))

  const categories: CatalogCategory[] = categoryIdList
    .map((catId) => {
      const catItems = items.filter((item) => {
        const rawCat = (xperienceData.catalogs as XpCatalog[]).find((r) => r.id === item.id)?.category
        return rawCat === catId
      })
      return {
        id: catId,
        name: categoryLabelMap[catId] || catId,
        count: catItems.length,
        items: catItems,
      }
    })
    .filter((cat) => cat.items.length > 0)

  return {
    total: items.length,
    categories,
    categoryDirectory: categories.map((c) => ({ id: c.id, name: c.name, count: c.count })),
    presets: (xperienceData.presets || []) as Array<{ id: string; label: string; hint: string }>,
    presetRows: (xperienceData.presetRows || {}) as Record<string, string[]>,
  }
}

export class CatalogResolver {
  async resolveCatalog(
    catalogId: string,
    type: 'movie' | 'series',
    options?: CatalogResolveOptions
  ): Promise<any[]> {
    const page = options?.page || 1
    const tmdb = new TmdbService({
      apiToken: options?.tmdbToken,
      language: options?.language,
      rpdbKey: options?.rpdbKey,
      posterConfig: options?.posterConfig,
      proxyUrl: options?.proxyUrl,
    })
    const mdblist = new MdbListService(options?.mdblistKey)
    const aiSearch = new AiSearchService(
      { geminiKey: options?.geminiKey, groqKey: options?.groqKey },
      tmdb
    )

    const isMovie = type === 'movie'
    const tmdbType = isMovie ? 'movie' : 'tv'
    const countryCode = getCountryCode(options?.region)

    // Build common discover params
    const discoverParams: Record<string, any> = { page }
    if (options?.hideAdult !== false) {
      discoverParams.include_adult = false
    }
    if (options?.excludeUnreleased) {
      const today = new Date().toISOString().split('T')[0]
      if (isMovie) {
        discoverParams['primary_release_date.lte'] = today
      } else {
        discoverParams['first_air_date.lte'] = today
      }
    }

    // Quality Floor (Good: 6.5+ rating, 100+ votes / Great: 7.5+ rating, 500+ votes)
    if (options?.qualityFloor === 'good') {
      discoverParams['vote_average.gte'] = 6.5
      discoverParams['vote_count.gte'] = 100
    } else if (options?.qualityFloor === 'great') {
      discoverParams['vote_average.gte'] = 7.5
      discoverParams['vote_count.gte'] = 500
    } else {
      discoverParams['vote_count.gte'] = 10
    }

    // Origin countries and Exclude countries
    if (options?.originCountries) {
      discoverParams.with_origin_country = Array.isArray(options.originCountries)
        ? options.originCountries.join('|')
        : options.originCountries
    }
    if (options?.excludeCountries) {
      discoverParams.without_origin_country = Array.isArray(options.excludeCountries)
        ? options.excludeCountries.join('|')
        : options.excludeCountries
    }

    // Max rating certification mapping (US standard)
    const maxRating = options?.maxRating || options?.ageRating
    if (maxRating && maxRating !== 'NONE' && maxRating !== 'any') {
      discoverParams.certification_country = 'US'
      switch (maxRating) {
        case 'G':
          discoverParams.certification = isMovie ? 'G' : 'TV-G'
          break
        case 'PG':
          discoverParams.certification = isMovie ? 'G|PG' : 'TV-G|TV-PG'
          break
        case 'PG-13':
          discoverParams.certification = isMovie ? 'G|PG|PG-13' : 'TV-G|TV-PG|TV-14'
          break
        case 'R':
          discoverParams.certification = isMovie ? 'G|PG|PG-13|R' : 'TV-G|TV-PG|TV-14|TV-MA'
          break
        default:
          discoverParams.certification = maxRating
      }
    }

    // 1. Search Query
    if (options?.search) {
      if (catalogId.includes('ai') || catalogId === 'tmdb.aisearch') {
        return aiSearch.searchWithAi(options.search, type, {
          rpdbKey: options?.rpdbKey,
          posterConfig: options?.posterConfig,
          language: options?.language,
          model: options?.aiModel,
          provider: options?.aiProvider,
          geminiKey: options?.geminiKey,
          groqKey: options?.groqKey,
        })
      }
      const searchRes = await tmdb.search(options.search, tmdbType, page, !options?.hideAdult)
      return (searchRes.results || []).map((item) =>
        tmdb.formatMetaPreview(item, type, {
          rpdbKey: options?.rpdbKey,
          posterConfig: options?.posterConfig,
        })
      )
    }

    // Check if catalog definition exists in extracted Xperience catalogs
    const xpCat = xpCatalogMap.get(catalogId)

    // 2. MDBList Catalogs (either from Xperience metadata, custom ID, or ad-hoc mdblist:<slug>)
    if (
      xpCat?.source === 'mdblist' ||
      catalogId.startsWith('mdblist.') ||
      catalogId.startsWith('mdblist:') ||
      catalogId.startsWith('snoak_top100') ||
      catalogId.startsWith('awards_')
    ) {
      let slug = xpCat?.source_params?.list || xpCat?.source_params?.list_id || 'snoak/todays-most-popular-movies'
      if (catalogId.startsWith('mdblist:')) slug = catalogId.replace('mdblist:', '')
      else if (catalogId === 'snoak_top100_series') slug = 'snoak/todays-most-popular-shows'
      else if (catalogId === 'awards_imdb_top250_movies') slug = 'snoak/imdb-top-250-movies'
      else if (catalogId === 'awards_letterboxd_top250') slug = 'snoak/letterboxd-top-250'
      else if (catalogId === 'awards_criterion') slug = 'snoak/the-criterion-collection'
      else if (catalogId === 'awards_oscars_winners') slug = 'snoak/academy-award-best-picture-winners'
      else if (catalogId.startsWith('mdblist.')) slug = catalogId.replace('mdblist.', '')

      const items = await mdblist.fetchListItems(String(slug), { page, rpdbKey: options?.rpdbKey })
      if (items.length > 0) return items
    }

    // 3. AI Generated Catalogs
    if (xpCat?.source === 'gemini' || xpCat?.requires?.includes('ai')) {
      const topic = xpCat.label || (isMovie ? 'Recommended Movies' : 'Recommended TV Shows')
      return aiSearch.searchWithAi(topic, type, {
        rpdbKey: options?.rpdbKey,
        posterConfig: options?.posterConfig,
        language: options?.language,
        model: options?.aiModel,
        provider: options?.aiProvider,
        geminiKey: options?.geminiKey,
        groqKey: options?.groqKey,
      })
    }

    let rawResults: any[] = []

    try {
      // 4. Dynamic Ad-Hoc Catalogs (Actors, Directors, Companies, Keywords)
      if (catalogId.startsWith('tmdb_actor:')) {
        const actorId = catalogId.replace('tmdb_actor:', '')
        const res = isMovie
          ? await tmdb.discoverMovie({ ...discoverParams, with_cast: actorId })
          : await tmdb.discoverTv({ ...discoverParams, with_cast: actorId })
        rawResults = res.results || []
      } else if (catalogId.startsWith('tmdb_director:')) {
        const directorId = catalogId.replace('tmdb_director:', '')
        const res = isMovie
          ? await tmdb.discoverMovie({ ...discoverParams, with_crew: directorId })
          : await tmdb.discoverTv({ ...discoverParams, with_crew: directorId })
        rawResults = res.results || []
      } else if (catalogId.startsWith('tmdb_company:')) {
        const companyId = catalogId.replace('tmdb_company:', '')
        const res = isMovie
          ? await tmdb.discoverMovie({ ...discoverParams, with_companies: companyId })
          : await tmdb.discoverTv({ ...discoverParams, with_companies: companyId })
        rawResults = res.results || []
      } else if (catalogId.startsWith('tmdb_keyword:')) {
        const keywordId = catalogId.replace('tmdb_keyword:', '')
        const res = isMovie
          ? await tmdb.discoverMovie({ ...discoverParams, with_keywords: keywordId })
          : await tmdb.discoverTv({ ...discoverParams, with_keywords: keywordId })
        rawResults = res.results || []
      } else if (catalogId.startsWith('tmdb_list:')) {
        const listId = catalogId.replace('tmdb_list:', '')
        try {
          const res = await tmdb.request<any>(`list/${listId}`, { page })
          rawResults = res.items || res.results || []
        } catch {
          rawResults = []
        }
      } else if (catalogId.startsWith('tmdb_watchlist') || catalogId.startsWith('tmdb_favorites')) {
        try {
          const [conn] = await db.select().from(accountConnections).where(eq(accountConnections.id, 'tmdb')).limit(1)
          if (conn) {
            const extra = conn.extraJson ? JSON.parse(conn.extraJson) : {}
            const accountId = extra.accountId
            const sessionId = conn.accessToken
            const isWatchlist = catalogId.startsWith('tmdb_watchlist')
            const fetchRes = isWatchlist
              ? await tmdbAccountService.getWatchlist(accountId, sessionId, isMovie ? 'movies' : 'tv', page)
              : await tmdbAccountService.getFavorites(accountId, sessionId, isMovie ? 'movies' : 'tv', page)
            rawResults = fetchRes.results || []
          }
        } catch {
          rawResults = []
        }
      } else if (catalogId.startsWith('trakt_watchlist') || catalogId.startsWith('trakt_recommendations')) {
        try {
          const [conn] = await db.select().from(accountConnections).where(eq(accountConnections.id, 'trakt')).limit(1)
          if (conn) {
            const isWatchlist = catalogId.startsWith('trakt_watchlist')
            const items = isWatchlist
              ? await traktService.getWatchlist(conn.accessToken, isMovie ? 'movies' : 'shows', page)
              : await traktService.getRecommendations(conn.accessToken, isMovie ? 'movies' : 'shows', page)
            rawResults = (items || []).map((item: any) => {
              const media = item.movie || item.show || item
              return {
                id: media.ids?.tmdb || media.ids?.imdb,
                imdb_id: media.ids?.imdb,
                title: media.title,
                name: media.title,
                release_date: media.year ? `${media.year}-01-01` : undefined,
                first_air_date: media.year ? `${media.year}-01-01` : undefined,
                overview: media.overview || '',
              }
            })
          }
        } catch {
          rawResults = []
        }
      } else if (catalogId === 'continue_watching' || catalogId.startsWith('continue_watching')) {
        try {
          const sessions = await playbackTrackerService.getContinueWatching(options?.profileId || 'default', 20)
          return sessions.map((s) => ({
            id: s.mediaId,
            type: s.mediaType === 'series' || s.mediaType === 'anime' ? 'series' : 'movie',
            name: s.episode ? `${s.title} S${s.season || 1}E${s.episode}` : s.title,
            poster: s.posterUrl,
            posterShape: 'poster',
            description: s.episodeTitle
              ? `${s.episodeTitle} • ${s.progressPercent}% watched`
              : `${s.progressPercent}% watched`,
            releaseInfo: `${s.progressPercent}%`,
          }))
        } catch {
          return []
        }
      }
      // 5. Data-driven TMDB resolution based on Xperience source_params
      else if (xpCat && xpCat.source === 'tmdb') {
        const p = xpCat.source_params || {}

        if (p.endpoint) {
          if (p.endpoint.includes('trending')) {
            const trendingRes = await tmdb.getTrending(tmdbType, 'week', page)
            rawResults = trendingRes.results || []
          } else {
            const res = await tmdb.request<{ results: any[] }>(p.endpoint, {
              page,
              language: options?.language,
            })
            rawResults = res.results || []
          }
        } else {
          // Dynamic discover query with exact parameters from Xperience
          const dynamicParams: Record<string, any> = { ...discoverParams }
          if (p.discover) {
            const providerId = STREAMING_PROVIDER_MAP[p.discover] || p.discover
            dynamicParams.with_watch_providers = providerId
            dynamicParams.watch_region = countryCode || 'US'
          }
          if (p.min_votes) dynamicParams['vote_count.gte'] = p.min_votes
          if (p.sort === 'top_rated') dynamicParams.sort_by = 'vote_average.desc'
          else if (p.sort === 'popular') dynamicParams.sort_by = 'popularity.desc'
          else if (p.sort) dynamicParams.sort_by = p.sort
          if (p.popular) dynamicParams.sort_by = 'popularity.desc'
          if (p.person_actor) dynamicParams.with_cast = p.person_actor
          if (p.person_director) dynamicParams.with_crew = p.person_director
          if (p.network) dynamicParams.with_networks = p.network
          if (p.company) dynamicParams.with_companies = p.company
          if (p.original_language) dynamicParams.with_original_language = p.original_language
          if (p.origin_country) dynamicParams.with_origin_country = p.origin_country
          if (p.genre) dynamicParams.with_genres = p.genre
          if (p.exclude_genres) {
            dynamicParams.without_genres = Array.isArray(p.exclude_genres)
              ? p.exclude_genres.join(',')
              : p.exclude_genres
          }
          if (p.keyword) dynamicParams.with_keywords = p.keyword

          if (p.year_from) {
            const fromDate = `${p.year_from}-01-01`
            if (isMovie) dynamicParams['primary_release_date.gte'] = fromDate
            else dynamicParams['first_air_date.gte'] = fromDate
          }
          if (p.year_to) {
            const toDate = `${p.year_to}-12-31`
            if (isMovie) dynamicParams['primary_release_date.lte'] = toDate
            else dynamicParams['first_air_date.lte'] = toDate
          }

          const res = isMovie
            ? await tmdb.discoverMovie(dynamicParams)
            : await tmdb.discoverTv(dynamicParams)
          rawResults = res.results || []
        }
      }
      // 5. Fallback heuristics for custom / legacy IDs
      else if (catalogId === 'trending_movies' || catalogId === 'trending_series' || catalogId.includes('trending')) {
        const trendingRes = await tmdb.getTrending(tmdbType, 'week', page)
        rawResults = trendingRes.results || []
      } else if (catalogId.includes('top_rated') || catalogId.includes('popular')) {
        const res = isMovie
          ? await tmdb.discoverMovie({ ...discoverParams, sort_by: 'vote_average.desc', 'vote_count.gte': 500 })
          : await tmdb.discoverTv({ ...discoverParams, sort_by: 'vote_average.desc', 'vote_count.gte': 300 })
        rawResults = res.results || []
      } else {
        // 6. Studio / Label Catalogs
        let handled = false
        for (const [studioKey, companyId] of Object.entries(STUDIO_MAP)) {
          if (catalogId.includes(studioKey)) {
            const res = isMovie
              ? await tmdb.discoverMovie({ ...discoverParams, with_companies: companyId })
              : await tmdb.discoverTv({ ...discoverParams, with_companies: companyId })
            rawResults = res.results || []
            handled = true
            break
          }
        }

        // 5. Streaming Providers
        if (!handled) {
          for (const [streamerKey, providerId] of Object.entries(STREAMING_PROVIDER_MAP)) {
            if (catalogId.includes(streamerKey)) {
              const res = isMovie
                ? await tmdb.discoverMovie({
                    ...discoverParams,
                    with_watch_providers: providerId,
                    watch_region: countryCode,
                  })
                : await tmdb.discoverTv({
                    ...discoverParams,
                    with_watch_providers: providerId,
                    watch_region: countryCode,
                  })
              rawResults = res.results || []
              handled = true
              break
            }
          }
        }

        // 6. Genres
        if (!handled) {
          for (const [genreKey, genreId] of Object.entries(GENRE_MAP)) {
            if (catalogId.includes(genreKey)) {
              const res = isMovie
                ? await tmdb.discoverMovie({ ...discoverParams, with_genres: genreId })
                : await tmdb.discoverTv({ ...discoverParams, with_genres: genreId })
              rawResults = res.results || []
              handled = true
              break
            }
          }
        }

        // 7. Anime Catalogs
        if (!handled && catalogId.includes('anime')) {
          const res = isMovie
            ? await tmdb.discoverMovie({ ...discoverParams, with_genres: 16, with_original_language: 'ja' })
            : await tmdb.discoverTv({ ...discoverParams, with_genres: 16, with_original_language: 'ja' })
          rawResults = res.results || []
          handled = true
        }

        // 8. Default Discover Fallback
        if (!handled) {
          const fallbackRes = isMovie
            ? await tmdb.discoverMovie({ ...discoverParams, sort_by: 'popularity.desc' })
            : await tmdb.discoverTv({ ...discoverParams, sort_by: 'popularity.desc' })
          rawResults = fallbackRes.results || []
        }
      }

      // Apply digital release filter if enabled for movies
      if (isMovie && options?.moviesDigitalOnly && rawResults.length > 0) {
        const filtered: any[] = []
        for (const item of rawResults) {
          const isDigital = await isMovieReleasedDigitally(item.id, options.tmdbToken, options.proxyUrl)
          if (isDigital) filtered.push(item)
        }
        rawResults = filtered
      }

      // Apply hideWatched and hideCaughtUp filters (skips search and personal lists)
      if (
        options?.profileId &&
        (options.hideWatched || options.hideCaughtUp) &&
        rawResults.length > 0 &&
        !catalogId.includes('watchlist') &&
        !catalogId.includes('favorites') &&
        !catalogId.includes('history') &&
        !catalogId.includes('custom_list_')
      ) {
        try {
          const sessions = await db
            .select()
            .from(playbackSessions)
            .where(eq(playbackSessions.profileId, options.profileId))

          const completedMediaIds = new Set(
            sessions
              .filter((s) => s.status === 'completed' || (s.progressPercent && s.progressPercent >= 90))
              .map((s) => String(s.mediaId))
          )

          if (completedMediaIds.size > 0) {
            rawResults = rawResults.filter((item) => {
              const tmdbIdStr = String(item.id)
              const imdbIdStr = item.imdb_id || item.external_ids?.imdb_id

              const isCompleted =
                completedMediaIds.has(tmdbIdStr) ||
                completedMediaIds.has(`tmdb:${tmdbIdStr}`) ||
                (imdbIdStr && completedMediaIds.has(imdbIdStr))

              if (options.hideWatched && isCompleted) {
                return false
              }

              if (options.hideCaughtUp && !isMovie && isCompleted) {
                return false
              }

              return true
            })
          }
        } catch (filterErr: any) {
          console.warn('[CatalogResolver] Watched/CaughtUp filter error:', filterErr.message)
        }
      }
    } catch (err: any) {
      console.warn(`[CatalogResolver] Fetch error for catalog "${catalogId}":`, err.message)
      return []
    }

    return rawResults.map((item) =>
      tmdb.formatMetaPreview(item, type, {
        rpdbKey: options?.rpdbKey,
        posterConfig: options?.posterConfig,
      })
    )
  }
}

export const resolver = new CatalogResolver()
