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

    // 2. MDBList Catalogs (e.g. snoak_top100_movies, mdblist.xyz)
    if (catalogId.startsWith('mdblist.') || catalogId.startsWith('snoak_top100') || catalogId.startsWith('awards_')) {
      let slug = 'snoak/todays-most-popular-movies'
      if (catalogId === 'snoak_top100_series') slug = 'snoak/todays-most-popular-shows'
      else if (catalogId === 'awards_imdb_top250_movies') slug = 'snoak/imdb-top-250-movies'
      else if (catalogId === 'awards_letterboxd_top250') slug = 'snoak/letterboxd-top-250'
      else if (catalogId === 'awards_criterion') slug = 'snoak/the-criterion-collection'
      else if (catalogId === 'awards_oscars_winners') slug = 'snoak/academy-award-best-picture-winners'
      else if (catalogId.startsWith('mdblist.')) slug = catalogId.replace('mdblist.', '')

      const items = await mdblist.fetchListItems(slug, { page, rpdbKey: options?.rpdbKey })
      if (items.length > 0) return items
    }

    let rawResults: any[] = []

    // 3. Trending & Popular
    if (catalogId === 'trending_movies' || catalogId === 'trending_series' || catalogId.includes('trending')) {
      const trendingRes = await tmdb.getTrending(tmdbType, 'week', page)
      rawResults = trendingRes.results || []
    } else if (catalogId.includes('top_rated') || catalogId.includes('popular')) {
      const res = isMovie
        ? await tmdb.discoverMovie({ ...discoverParams, sort_by: 'vote_average.desc', 'vote_count.gte': 500 })
        : await tmdb.discoverTv({ ...discoverParams, sort_by: 'vote_average.desc', 'vote_count.gte': 300 })
      rawResults = res.results || []
    } else {
      // 4. Studio / Label Catalogs
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

    return rawResults.map((item) =>
      tmdb.formatMetaPreview(item, type, { rpdbKey: options?.rpdbKey })
    )
  }
}
