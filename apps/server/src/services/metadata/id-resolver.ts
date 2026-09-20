import { config } from '../../config'

export interface ResolvedMediaId {
  tmdbId?: number
  imdbId?: string
  kitsuId?: number
  anilistId?: number
  malId?: number
  type: 'movie' | 'series' | 'anime'
  mediaType?: 'movie' | 'series' | 'anime'
  rawId?: string
  season?: number
  episode?: number
  streamQueryId?: string // Canonical ID for stream scraping (e.g. tt1234567 or tt1234567:1:1)
}

interface CachedIdMapping {
  timestamp: number
  ids: ResolvedMediaId
}

export class IdResolverService {
  private cache = new Map<string, CachedIdMapping>()
  private cacheTtlMs = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Resolves any incoming media ID into its canonical IDs across TMDB, IMDb, Kitsu, AniList, and MAL.
   * Handles formats:
   * - `tt1234567` (IMDb movie)
   * - `tt1234567:1:2` (IMDb series with season & episode)
   * - `tmdb:12345` or `12345` (TMDB movie)
   * - `tmdb:12345:1:2` or `12345:1:2` (TMDB series with season & episode)
   * - `kitsu:1234` or `kitsu:1234:5` (Kitsu anime)
   * - `anilist:1234` or `anilist:1234:5` (AniList anime)
   * - `mal:1234` or `mal:1234:5` (MyAnimeList anime)
   */
  async resolve(idString: string, defaultType: 'movie' | 'series' | 'anime' = 'movie'): Promise<ResolvedMediaId> {
    const cached = this.cache.get(idString)
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.ids
    }

    const parts = idString.split(':')
    const prefix = parts[0]
    let season: number | undefined
    let episode: number | undefined
    let tmdbNumeric: number | undefined

    // 1. Check if prefix is 'tmdb' (e.g. tmdb:12345 or tmdb:12345:1:2)
    if (prefix === 'tmdb') {
      if (parts[1] && !isNaN(Number(parts[1]))) {
        tmdbNumeric = Number(parts[1])
      }
      if (parts.length >= 4 && !isNaN(Number(parts[2])) && !isNaN(Number(parts[3]))) {
        season = Number(parts[2])
        episode = Number(parts[3])
      }
    }
    // 2. Check if prefix is IMDb (e.g. tt1234567 or tt1234567:1:2)
    else if (prefix.startsWith('tt')) {
      if (parts.length >= 3 && !isNaN(Number(parts[1])) && !isNaN(Number(parts[2]))) {
        season = Number(parts[1])
        episode = Number(parts[2])
      }
    }
    // 3. Check if prefix is Anime (kitsu/anilist/mal)
    else if (prefix === 'kitsu' || prefix === 'anilist' || prefix === 'mal') {
      if (parts.length >= 3 && !isNaN(Number(parts[2]))) {
        episode = Number(parts[2])
      }
    }
    // 4. Pure numeric TMDB ID (e.g. 12345 or 12345:1:2)
    else if (!isNaN(Number(prefix))) {
      tmdbNumeric = Number(prefix)
      if (parts.length >= 3 && !isNaN(Number(parts[1])) && !isNaN(Number(parts[2]))) {
        season = Number(parts[1])
        episode = Number(parts[2])
      }
    }

    const mediaType = (prefix === 'kitsu' || prefix === 'anilist' || prefix === 'mal')
      ? 'anime'
      : (season !== undefined ? 'series' : defaultType)

    const result: ResolvedMediaId = {
      type: mediaType,
      mediaType,
      rawId: idString,
      season,
      episode,
      tmdbId: tmdbNumeric,
    }

    // A. If it's an IMDb ID: `tt1234567`
    if (prefix.startsWith('tt')) {
      result.imdbId = prefix
      result.streamQueryId = season !== undefined && episode !== undefined
        ? `${prefix}:${season}:${episode}`
        : prefix

      try {
        const tmdbMatch = await this.findTmdbByImdb(prefix)
        if (tmdbMatch) {
          result.tmdbId = tmdbMatch.id
          result.type = tmdbMatch.type
          result.mediaType = tmdbMatch.type
        }
      } catch {
        // Graceful fallback
      }
    }
    // B. If we have a TMDB ID
    else if (result.tmdbId) {
      try {
        const imdb = await this.findImdbByTmdb(result.tmdbId, result.type)
        if (imdb) {
          result.imdbId = imdb
          result.streamQueryId = season !== undefined && episode !== undefined
            ? `${imdb}:${season}:${episode}`
            : imdb
        }
      } catch {
        // Graceful fallback
      }
    }
    // C. If it's Kitsu: `kitsu:1234`
    else if (prefix === 'kitsu' && parts[1]) {
      result.kitsuId = Number(parts[1])
      result.type = 'anime'
      result.mediaType = 'anime'
      result.streamQueryId = idString
    }
    // D. If it's AniList: `anilist:1234`
    else if (prefix === 'anilist' && parts[1]) {
      result.anilistId = Number(parts[1])
      result.type = 'anime'
      result.mediaType = 'anime'
      result.streamQueryId = idString
    }
    // E. If it's MAL: `mal:1234`
    else if (prefix === 'mal' && parts[1]) {
      result.malId = Number(parts[1])
      result.type = 'anime'
      result.mediaType = 'anime'
      result.streamQueryId = idString
    }

    // Default streamQueryId to rawId if still empty
    if (!result.streamQueryId) {
      result.streamQueryId = idString
    }

    // Cache the resolved result
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }
    this.cache.set(idString, { timestamp: Date.now(), ids: result })

    return result
  }

  private async findTmdbByImdb(
    imdbId: string
  ): Promise<{ id: number; type: 'movie' | 'series' } | null> {
    try {
      const apiKey = config.tmdb.apiKey
      if (!apiKey) return null
      const res = await fetch(
        `${config.tmdb.baseUrl}/find/${imdbId}?api_key=${apiKey}&external_source=imdb_id`,
        { signal: AbortSignal.timeout(3500) }
      )
      if (!res.ok) return null
      const data: any = await res.json()

      if (data.movie_results && data.movie_results.length > 0) {
        return { id: data.movie_results[0].id, type: 'movie' }
      }
      if (data.tv_results && data.tv_results.length > 0) {
        return { id: data.tv_results[0].id, type: 'series' }
      }
      return null
    } catch {
      return null
    }
  }

  private async findImdbByTmdb(
    tmdbId: number,
    type: 'movie' | 'series' | 'anime'
  ): Promise<string | null> {
    try {
      const apiKey = config.tmdb.apiKey
      if (!apiKey) return null
      const endpoint = type === 'series' || type === 'anime' ? 'tv' : 'movie'
      const res = await fetch(
        `${config.tmdb.baseUrl}/${endpoint}/${tmdbId}/external_ids?api_key=${apiKey}`,
        { signal: AbortSignal.timeout(3500) }
      )
      if (!res.ok) return null
      const data: any = await res.json()
      return data.imdb_id || null
    } catch {
      return null
    }
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const idResolverService = new IdResolverService()
export const crossPlatformIdResolver = idResolverService
