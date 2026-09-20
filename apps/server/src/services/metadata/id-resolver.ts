export interface ResolvedMediaId {
  tmdbId?: number
  imdbId?: string
  kitsuId?: number
  type: 'movie' | 'series' | 'anime'
  season?: number
  episode?: number
}

interface CachedIdMapping {
  timestamp: number
  ids: ResolvedMediaId
}

export class IdResolverService {
  private cache = new Map<string, CachedIdMapping>()
  private cacheTtlMs = 24 * 60 * 60 * 1000 // 24 hours

  /**
   * Resolves any incoming media ID into its canonical IDs across TMDB, IMDb, and Kitsu.
   * Handles formats:
   * - `tt1234567` (IMDb)
   * - `tt1234567:1:2` (IMDb with season & episode)
   * - `tmdb:12345` or `12345` (TMDB)
   * - `tmdb:12345:1:2` (TMDB with season & episode)
   * - `kitsu:1234` or `kitsu:1234:5` (Kitsu)
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

    // Parse season & episode if present
    if (parts.length >= 3 && !isNaN(Number(parts[1])) && !isNaN(Number(parts[2]))) {
      season = Number(parts[1])
      episode = Number(parts[2])
    } else if (parts.length === 2 && prefix === 'kitsu' && !isNaN(Number(parts[1]))) {
      // kitsu:1234
    } else if (parts.length === 3 && prefix === 'kitsu' && !isNaN(Number(parts[2]))) {
      // kitsu:1234:5
      episode = Number(parts[2])
    }

    const result: ResolvedMediaId = {
      type: season !== undefined || parts.length >= 3 ? 'series' : defaultType,
      season,
      episode,
    }

    // 1. If it's an IMDb ID: `tt1234567`
    if (prefix.startsWith('tt')) {
      result.imdbId = prefix
      try {
        // Query TMDB /find/tt...
        const tmdbMatch = await this.findTmdbByImdb(prefix)
        if (tmdbMatch) {
          result.tmdbId = tmdbMatch.id
          result.type = tmdbMatch.type
        }
      } catch {
        // Graceful fallback
      }
    }
    // 2. If it's a TMDB ID: `tmdb:12345` or numeric
    else if (prefix === 'tmdb' && parts[1]) {
      const tmdbNumeric = Number(parts[1])
      if (!isNaN(tmdbNumeric)) {
        result.tmdbId = tmdbNumeric
        try {
          const imdb = await this.findImdbByTmdb(tmdbNumeric, result.type)
          if (imdb) result.imdbId = imdb
        } catch {
          // Graceful fallback
        }
      }
    }
    // 3. If it's pure numeric TMDB ID
    else if (!isNaN(Number(prefix))) {
      result.tmdbId = Number(prefix)
      try {
        const imdb = await this.findImdbByTmdb(result.tmdbId, result.type)
        if (imdb) result.imdbId = imdb
      } catch {
        // Graceful fallback
      }
    }
    // 4. If it's Kitsu: `kitsu:1234`
    else if (prefix === 'kitsu' && parts[1]) {
      result.kitsuId = Number(parts[1])
      result.type = 'anime'
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
      const apiKey = process.env.TMDB_API_KEY || '4b7454f76cdb94098caebf7c00e1634a'
      const res = await fetch(
        `https://api.themoviedb.org/3/find/${imdbId}?api_key=${apiKey}&external_source=imdb_id`,
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
      const apiKey = process.env.TMDB_API_KEY || '4b7454f76cdb94098caebf7c00e1634a'
      const endpoint = type === 'series' || type === 'anime' ? 'tv' : 'movie'
      const res = await fetch(
        `https://api.themoviedb.org/3/${endpoint}/${tmdbId}/external_ids?api_key=${apiKey}`,
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
