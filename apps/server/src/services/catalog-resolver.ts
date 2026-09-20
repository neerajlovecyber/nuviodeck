import { TmdbService } from './tmdb'
import { MdbListService } from './mdblist'
import { AiSearchService } from './ai-search'
import { isMovieReleasedDigitally } from './release-filter'

export interface CatalogResolveOptions {
  page?: number
  genre?: string
  search?: string
  tmdbToken?: string
  mdblistKey?: string
  geminiKey?: string
  rpdbKey?: string
  language?: string
  hideAdult?: boolean
  excludeUnreleased?: boolean
  moviesDigitalOnly?: boolean
  ageRating?: string
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
      proxyUrl: options?.proxyUrl,
    })
    const mdblist = new MdbListService(options?.mdblistKey)
    const aiSearch = new AiSearchService(options?.geminiKey, tmdb)

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
    if (options?.ageRating && options.ageRating !== 'NONE') {
      discoverParams.certification_country = 'US'
      discoverParams.certification = options.ageRating
    }

    // 1. Search Query
    if (options?.search) {
      if (catalogId.includes('ai') || catalogId === 'tmdb.aisearch') {
        return aiSearch.searchWithAi(options.search, type, {
          rpdbKey: options?.rpdbKey,
          language: options?.language,
        })
      }
      const searchRes = await tmdb.search(options.search, tmdbType, page, !options?.hideAdult)
      return (searchRes.results || []).map((item) =>
        tmdb.formatMetaPreview(item, type, { rpdbKey: options?.rpdbKey })
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
        language: options?.language,
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
          if (p.min_votes) dynamicParams['vote_count.gte'] = p.min_votes
          if (p.sort) dynamicParams.sort_by = p.sort
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
    } catch (err: any) {
      console.warn(`[CatalogResolver] Fetch error for catalog "${catalogId}":`, err.message)
      return []
    }

    return rawResults.map((item) =>
      tmdb.formatMetaPreview(item, type, { rpdbKey: options?.rpdbKey })
    )
  }
}
