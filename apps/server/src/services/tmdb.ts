import { config } from '../config'
import { getPosterUrl, getBackdropUrl } from './posters'
import { getMediaLogo } from './logos'
import { getCustomEpisodeGroup, getCustomImdbId, fetchEpisodeGroup } from './episode-groups'
import { isMovieReleasedDigitally } from './release-filter'

export interface TmdbClientOptions {
  apiToken?: string
  apiKey?: string
  language?: string
  rpdbKey?: string
  proxyUrl?: string
}

// Simple in-memory cache for API responses (TTL: 10 minutes)
interface CacheEntry {
  data: any
  expiresAt: number
}
const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 10 * 60 * 1000

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

function setCached(key: string, data: any, ttlMs = CACHE_TTL_MS) {
  if (cache.size > 1000) {
    const now = Date.now()
    for (const [k, v] of cache.entries()) {
      if (now > v.expiresAt) cache.delete(k)
    }
  }
  cache.set(key, { data, expiresAt: Date.now() + ttlMs })
}

export class TmdbService {
  private apiToken: string
  private apiKey: string
  private baseUrl: string
  private defaultLanguage: string
  private proxyUrl?: string

  constructor(options?: TmdbClientOptions) {
    this.apiToken = options?.apiToken || config.tmdb.apiToken
    this.apiKey = options?.apiKey || config.tmdb.apiKey
    this.baseUrl = config.tmdb.baseUrl
    this.defaultLanguage = options?.language || 'en-US'
    this.proxyUrl = options?.proxyUrl || config.tmdb.proxyUrl
  }

  private async request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}/${endpoint.replace(/^\//, '')}`)
    
    // Add language if not provided
    if (!params.language) {
      params.language = this.defaultLanguage
    }

    // If using API Key (not bearer token), attach to params
    if (!this.apiToken && this.apiKey) {
      params.api_key = this.apiKey
    }

    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v))
      }
    }

    const cacheKey = url.toString()
    const cached = getCached<T>(cacheKey)
    if (cached) return cached

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'Nuviodeck-Engine/1.0.0',
    }

    if (this.apiToken) {
      headers['Authorization'] = `Bearer ${this.apiToken}`
    }

    const fetchOptions: RequestInit & { proxy?: string } = {
      method: 'GET',
      headers,
    }

    if (this.proxyUrl) {
      fetchOptions.proxy = this.proxyUrl
    }

    const res = await fetch(url.toString(), fetchOptions)
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`TMDB error (${res.status}): ${errText || res.statusText}`)
    }

    const data = (await res.json()) as T
    setCached(cacheKey, data)
    return data
  }

  // --- Trending ---
  async getTrending(type: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week', page = 1) {
    return this.request<{ results: any[]; page: number; total_pages: number }>(
      `trending/${type}/${timeWindow}`,
      { page }
    )
  }

  // --- Discover ---
  async discoverMovie(params: Record<string, any> = {}) {
    return this.request<{ results: any[]; page: number; total_pages: number }>('discover/movie', {
      sort_by: 'popularity.desc',
      include_adult: false,
      'vote_count.gte': 20,
      ...params,
    })
  }

  async discoverTv(params: Record<string, any> = {}) {
    return this.request<{ results: any[]; page: number; total_pages: number }>('discover/tv', {
      sort_by: 'popularity.desc',
      include_adult: false,
      'vote_count.gte': 10,
      ...params,
    })
  }

  // --- Details ---
  async getMovieDetails(id: number | string, language?: string) {
    return this.request<any>(`movie/${id}`, {
      append_to_response: 'credits,videos,release_dates,external_ids',
      language: language || this.defaultLanguage,
    })
  }

  async getTvDetails(id: number | string, language?: string) {
    return this.request<any>(`tv/${id}`, {
      append_to_response: 'credits,videos,content_ratings,external_ids',
      language: language || this.defaultLanguage,
    })
  }

  async getTvSeason(id: number | string, seasonNumber: number, language?: string) {
    return this.request<any>(`tv/${id}/season/${seasonNumber}`, {
      language: language || this.defaultLanguage,
    })
  }

  // --- Search ---
  async search(query: string, type: 'movie' | 'tv' | 'multi' = 'multi', page = 1, includeAdult = false) {
    const endpoint = type === 'movie' ? 'search/movie' : type === 'tv' ? 'search/tv' : 'search/multi'
    return this.request<{ results: any[]; page: number; total_pages: number }>(endpoint, {
      query,
      page,
      include_adult: includeAdult,
    })
  }

  // --- Find by External ID (e.g. IMDb ID) ---
  async findByExternalId(externalId: string, source: 'imdb_id' = 'imdb_id') {
    return this.request<{ movie_results: any[]; tv_results: any[] }>(`find/${externalId}`, {
      external_source: source,
    })
  }

  // --- Stremio Meta Formatters ---
  formatMetaPreview(item: any, type: 'movie' | 'series', options?: { rpdbKey?: string }): any {
    const isMovie = type === 'movie' || item.media_type === 'movie' || !!item.title
    const title = item.title || item.name || 'Untitled'
    const releaseDate = item.release_date || item.first_air_date || ''
    const year = releaseDate ? releaseDate.split('-')[0] : ''
    const tmdbId = item.id
    const customImdbId = getCustomImdbId(tmdbId)
    const imdbId = customImdbId || item.imdb_id || item.external_ids?.imdb_id

    const id = imdbId || `tmdb:${tmdbId}`
    const poster = getPosterUrl(item.poster_path, {
      imdbId,
      tmdbId,
      type: isMovie ? 'movie' : 'series',
      rpdbKey: options?.rpdbKey,
    })

    return {
      id,
      type: isMovie ? 'movie' : 'series',
      name: title,
      poster,
      posterShape: 'poster',
      banner: getBackdropUrl(item.backdrop_path),
      description: item.overview || '',
      releaseInfo: year,
      imdbRating: item.vote_average ? Number(item.vote_average.toFixed(1)) : undefined,
    }
  }

  async formatFullMeta(details: any, type: 'movie' | 'series', options?: { rpdbKey?: string }): Promise<any> {
    const isMovie = type === 'movie'
    const title = details.title || details.name || 'Untitled'
    const releaseDate = details.release_date || details.first_air_date || ''
    const year = releaseDate ? releaseDate.split('-')[0] : ''
    const tmdbId = details.id
    const customImdbId = getCustomImdbId(tmdbId)
    const imdbId = customImdbId || details.external_ids?.imdb_id || details.imdb_id

    const genres = details.genres?.map((g: any) => g.name) || []
    const cast = details.credits?.cast?.slice(0, 10).map((c: any) => c.name) || []
    const director = details.credits?.crew?.filter((c: any) => c.job === 'Director').map((c: any) => c.name) || []

    const id = imdbId || `tmdb:${tmdbId}`
    const poster = getPosterUrl(details.poster_path, {
      imdbId,
      tmdbId,
      type,
      rpdbKey: options?.rpdbKey,
    })

    // Trailer video
    const trailers = (details.videos?.results || [])
      .filter((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
      .map((v: any) => ({
        source: v.key,
        type: 'Trailer',
      }))

    // Fetch High-Res Transparent ClearLogo
    const logo = await getMediaLogo(
      type,
      tmdbId,
      this.defaultLanguage,
      details.original_language,
      this.apiToken || this.apiKey,
      this.proxyUrl
    ).catch(() => '')

    const meta: any = {
      id,
      imdb_id: imdbId,
      type,
      name: title,
      genres,
      poster,
      posterShape: 'poster',
      background: getBackdropUrl(details.backdrop_path, 'original'),
      logo: logo || undefined,
      description: details.overview || '',
      releaseInfo: year,
      runtime: isMovie && details.runtime ? `${details.runtime} min` : undefined,
      cast,
      director,
      imdbRating: details.vote_average ? Number(details.vote_average.toFixed(1)) : undefined,
      trailers,
    }

    // Series episodes (with Episode Group ordering fix for anime & multi-part shows)
    if (!isMovie) {
      const episodes: any[] = []
      const customGroup = getCustomEpisodeGroup(tmdbId)

      if (customGroup?.episodeGroupId) {
        // Fetch customized episode groups (e.g. One Piece, Money Heist, Star Wars Clone Wars)
        const groupData = await fetchEpisodeGroup(
          customGroup.episodeGroupId,
          this.apiToken || this.apiKey,
          this.proxyUrl
        ).catch(() => null)

        if (groupData?.groups) {
          for (const grp of groupData.groups) {
            for (const ep of grp.episodes) {
              episodes.push({
                id: `${id}:${ep.season_number}:${ep.episode_number}`,
                title: ep.name || `Episode ${ep.episode_number}`,
                season: ep.season_number,
                number: ep.episode_number,
                episode: ep.episode_number,
                released: ep.air_date ? new Date(ep.air_date).toISOString() : undefined,
                overview: ep.overview,
                thumbnail: getBackdropUrl(ep.still_path, 'w780'),
              })
            }
          }
        }
      }

      // Fallback to standard TMDB seasons if no custom group or group fetch failed
      if (episodes.length === 0 && details.seasons) {
        for (const season of details.seasons) {
          if (season.season_number === 0 && season.episode_count === 0) continue
          try {
            const seasonData = await this.getTvSeason(tmdbId, season.season_number, this.defaultLanguage)
            if (seasonData.episodes) {
              for (const ep of seasonData.episodes) {
                episodes.push({
                  id: `${id}:${ep.season_number}:${ep.episode_number}`,
                  title: ep.name || `Episode ${ep.episode_number}`,
                  season: ep.season_number,
                  number: ep.episode_number,
                  episode: ep.episode_number,
                  released: ep.air_date ? new Date(ep.air_date).toISOString() : undefined,
                  overview: ep.overview,
                  thumbnail: getBackdropUrl(ep.still_path, 'w780'),
                })
              }
            }
          } catch {
            // ignore individual season fetch errors
          }
        }
      }

      meta.videos = episodes
    }

    return meta
  }
}
