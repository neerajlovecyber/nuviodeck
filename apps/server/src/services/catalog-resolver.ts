import { TmdbService } from './tmdb'
import { MdbListService } from './mdblist'
import { AiSearchService } from './ai-search'

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
    })
    const mdblist = new MdbListService(options?.mdblistKey)
    const aiSearch = new AiSearchService(options?.geminiKey, tmdb)

    const isMovie = type === 'movie'
    const tmdbType = isMovie ? 'movie' : 'tv'

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

    // 3. Trending & Popular
    if (catalogId === 'trending_movies' || catalogId === 'trending_series' || catalogId.includes('trending')) {
      const trendingRes = await tmdb.getTrending(tmdbType, 'week', page)
      return (trendingRes.results || []).map((item) =>
        tmdb.formatMetaPreview(item, type, { rpdbKey: options?.rpdbKey })
      )
    }

    if (catalogId.includes('top_rated') || catalogId.includes('popular')) {
      const res = isMovie
        ? await tmdb.discoverMovie({ sort_by: 'vote_average.desc', 'vote_count.gte': 500, page })
        : await tmdb.discoverTv({ sort_by: 'vote_average.desc', 'vote_count.gte': 300, page })
      return (res.results || []).map((item) =>
        tmdb.formatMetaPreview(item, type, { rpdbKey: options?.rpdbKey })
      )
    }

    // 4. Studio / Label Catalogs (e.g. studio_a24_movies, studio_marvel_movies)
    for (const [studioKey, companyId] of Object.entries(STUDIO_MAP)) {
      if (catalogId.includes(studioKey)) {
        const res = isMovie
          ? await tmdb.discoverMovie({ with_companies: companyId, page })
          : await tmdb.discoverTv({ with_companies: companyId, page })
        return (res.results || []).map((item) =>
          tmdb.formatMetaPreview(item, type, { rpdbKey: options?.rpdbKey })
        )
      }
    }

    // 5. Streaming Providers (e.g. streaming_netflix_movies, snoak_netflix_top10)
    for (const [streamerKey, providerId] of Object.entries(STREAMING_PROVIDER_MAP)) {
      if (catalogId.includes(streamerKey)) {
        const res = isMovie
          ? await tmdb.discoverMovie({ with_watch_providers: providerId, watch_region: 'US', page })
          : await tmdb.discoverTv({ with_watch_providers: providerId, watch_region: 'US', page })
        return (res.results || []).map((item) =>
          tmdb.formatMetaPreview(item, type, { rpdbKey: options?.rpdbKey })
        )
      }
    }

    // 6. Genres (e.g. genre_action_movies, genre_scifi_movies)
    for (const [genreKey, genreId] of Object.entries(GENRE_MAP)) {
      if (catalogId.includes(genreKey)) {
        const res = isMovie
          ? await tmdb.discoverMovie({ with_genres: genreId, page })
          : await tmdb.discoverTv({ with_genres: genreId, page })
        return (res.results || []).map((item) =>
          tmdb.formatMetaPreview(item, type, { rpdbKey: options?.rpdbKey })
        )
      }
    }

    // 7. Anime Catalogs
    if (catalogId.includes('anime')) {
      const res = isMovie
        ? await tmdb.discoverMovie({ with_genres: 16, with_original_language: 'ja', page })
        : await tmdb.discoverTv({ with_genres: 16, with_original_language: 'ja', page })
      return (res.results || []).map((item) =>
        tmdb.formatMetaPreview(item, type, { rpdbKey: options?.rpdbKey })
      )
    }

    // 8. Default Discover Fallback
    const fallbackRes = isMovie
      ? await tmdb.discoverMovie({ sort_by: 'popularity.desc', page })
      : await tmdb.discoverTv({ sort_by: 'popularity.desc', page })

    return (fallbackRes.results || []).map((item) =>
      tmdb.formatMetaPreview(item, type, { rpdbKey: options?.rpdbKey })
    )
  }
}
