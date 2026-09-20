import { config } from '../config'

export interface ProviderCardConfig {
  enabled?: boolean
  key?: string
  url?: string
}

export interface PosterProviderConfig {
  customUrl?: string
  betterpostersUrl?: string
  easyratingUrl?: string
  toppostersKey?: string
  rpdbKey?: string
  omdbKey?: string
  fanartKey?: string
  xrdbUrl?: string
  postersplusUrl?: string
  simklKey?: string
  simklUrl?: string
  providerOrder?: string[]
  providers?: Record<string, ProviderCardConfig>
  showRatingsOnPosters?: boolean
  ratingBadgedEpisodeStills?: boolean
}

export interface PosterResolveOptions {
  imdbId?: string | null
  tmdbId?: number | string | null
  type?: 'movie' | 'series' | 'anime'
  season?: number | null
  episode?: number | null
  width?: 'w300' | 'w342' | 'w500' | 'w780' | 'original'
  config?: PosterProviderConfig
  rpdbKey?: string
}

export class PosterEngineService {
  /**
   * Supported providers list with metadata matching Xperience suite
   */
  getProvidersList() {
    return [
      { id: 'custom', name: 'Custom URL', type: 'url', placeholder: 'https://proxy.com/{type}/{id}.jpg', supportsEpisodeStills: true, supportsSeasonPosters: true },
      { id: 'betterposters', name: 'BetterPosters', type: 'url', configureUrl: 'https://btttr.cc', placeholder: 'https://btttr.cc/config/token', supportsSeasonPosters: true },
      { id: 'easyrating', name: 'EasyRatings (ERDB)', type: 'url', configureUrl: 'https://easyratingsdb.com', placeholder: 'https://easyratingsdb.com/...', supportsEpisodeStills: true, supportsSeasonPosters: true },
      { id: 'topposters', name: 'Top Posters', type: 'key', configureUrl: 'https://top-streaming.stream', placeholder: 'topposters api key', supportsEpisodeStills: true, supportsSeasonPosters: true },
      { id: 'rpdb', name: 'RPDB', type: 'key', configureUrl: 'https://ratingposterdb.com', placeholder: 'rpdb api key', supportsSeasonPosters: true },
      { id: 'simkl', name: 'Simkl Posters', type: 'key', configureUrl: 'https://simkl.com', placeholder: 'simkl client id or url' },
      { id: 'omdb', name: 'OMDb', type: 'key', configureUrl: 'https://omdbapi.com/apikey.aspx', placeholder: 'omdb api key' },
      { id: 'fanart', name: 'Fanart.tv', type: 'key', configureUrl: 'https://fanart.tv/get-an-api-key', placeholder: 'fanart api key' },
      { id: 'xrdb', name: 'XRDB', type: 'url', configureUrl: 'https://xrdb.ibbylabs.dev', placeholder: 'https://xrdb-host or poster url', supportsEpisodeStills: true, supportsSeasonPosters: true },
      { id: 'postersplus', name: 'Posters+', type: 'url', configureUrl: 'https://postersplus.elfhosted.com', placeholder: 'posters+ poster url', supportsEpisodeStills: true, supportsSeasonPosters: true },
    ]
  }

  getDefaultOrder() {
    return [
      'custom',
      'betterposters',
      'easyrating',
      'topposters',
      'rpdb',
      'simkl',
      'omdb',
      'fanart',
      'xrdb',
      'postersplus',
    ]
  }

  /**
   * Helper to retrieve a provider's key or URL from either:
   * 1. The dragged-card dictionary: cfg.providers[providerId] (with enabled check)
   * 2. The flat property: cfg[providerKey/Url] or system config
   */
  getProviderValue(cfg: PosterProviderConfig, provider: string): string | null {
    // Check dragged card object in providers map
    const card = cfg.providers?.[provider]
    if (card !== undefined) {
      if (card.enabled === false) return null
      const val = (card.key || card.url || '').trim()
      if (val) return val
    }

    // Check flat configuration properties
    switch (provider) {
      case 'custom':
        return cfg.customUrl?.trim() || null
      case 'betterposters':
        return cfg.betterpostersUrl?.trim() || null
      case 'easyrating':
        return cfg.easyratingUrl?.trim() || null
      case 'topposters':
        return cfg.toppostersKey?.trim() || null
      case 'rpdb':
        return cfg.rpdbKey?.trim() || config.rpdb.apiKey?.trim() || null
      case 'simkl':
        return cfg.simklKey?.trim() || cfg.simklUrl?.trim() || null
      case 'omdb':
        return cfg.omdbKey?.trim() || null
      case 'fanart':
        return cfg.fanartKey?.trim() || null
      case 'xrdb':
        return cfg.xrdbUrl?.trim() || null
      case 'postersplus':
        return cfg.postersplusUrl?.trim() || null
      default:
        return null
    }
  }

  /**
   * Resolve poster artwork according to user's drag-and-drop provider priority order
   */
  getPosterUrl(
    posterPath: string | null | undefined,
    options?: PosterResolveOptions
  ): string | null {
    const cfg = options?.config || {}
    if (options?.rpdbKey && !cfg.rpdbKey) {
      cfg.rpdbKey = options.rpdbKey
    }

    const showRatings = cfg.showRatingsOnPosters ?? true
    const imdbId = options?.imdbId
    const tmdbId = options?.tmdbId
    const isMovie = options?.type === 'movie'
    const type = isMovie ? 'movie' : 'series'
    const season = options?.season

    const order = cfg.providerOrder || this.getDefaultOrder()

    if (showRatings) {
      for (const provider of order) {
        const val = this.getProviderValue(cfg, provider)
        if (!val) continue

        // Check if resolving season-specific poster
        if (season !== undefined && season !== null && season > 0 && !isMovie) {
          const seasonUrl = this.resolveSeasonPoster(provider, val, tmdbId, imdbId, season)
          if (seasonUrl) return seasonUrl
        }

        switch (provider) {
          case 'custom':
            if (imdbId || tmdbId) {
              return val
                .replace('{id}', String(imdbId || tmdbId))
                .replace('{imdbId}', imdbId || '')
                .replace('{imdb_id}', imdbId || '')
                .replace('{tmdbId}', String(tmdbId || ''))
                .replace('{tmdb_id}', String(tmdbId || ''))
                .replace('{type}', type)
            }
            break

          case 'betterposters':
            if (imdbId || tmdbId) {
              if (val.includes('{')) {
                return val
                  .replace('{id}', String(imdbId || tmdbId))
                  .replace('{imdbId}', imdbId || '')
                  .replace('{imdb_id}', imdbId || '')
                  .replace('{tmdbId}', String(tmdbId || ''))
                  .replace('{tmdb_id}', String(tmdbId || ''))
                  .replace('{type}', type)
              }
              const base = val.replace(/\/+$/, '')
              return `${base}/${type}/${imdbId || `tmdb-${tmdbId}`}.jpg`
            }
            break

          case 'easyrating':
            if (imdbId || tmdbId) {
              const targetId = imdbId || `tmdb-${tmdbId}`
              if (val.startsWith('Tk-') || !val.startsWith('http')) {
                return `https://easyratingsdb.com/${val}/poster/${targetId}.jpg`
              }
              if (val.includes('{')) {
                return val
                  .replace('{id}', String(imdbId || tmdbId))
                  .replace('{imdbId}', imdbId || '')
                  .replace('{imdb_id}', imdbId || '')
                  .replace('{tmdbId}', String(tmdbId || ''))
                  .replace('{tmdb_id}', String(tmdbId || ''))
                  .replace('{type}', type)
              }
              const base = val.replace(/\/+$/, '')
              return `${base}/poster/${targetId}.jpg`
            }
            break

          case 'topposters':
            if (tmdbId || imdbId) {
              if (tmdbId) {
                const prefix = isMovie ? '' : 'series-'
                return `https://api.top-streaming.stream/${val}/tmdb/poster-default/${prefix}${tmdbId}.jpg`
              }
              return `https://api.top-streaming.stream/${val}/imdb/poster-default/${imdbId}.jpg`
            }
            break

          case 'rpdb':
            if (imdbId) {
              return `https://api.ratingposterdb.com/${val}/imdb/poster-default/${imdbId}.jpg`
            }
            if (tmdbId) {
              return `https://api.ratingposterdb.com/${val}/tmdb/poster-default/${tmdbId}.jpg`
            }
            break

          case 'simkl':
            if (imdbId || tmdbId) {
              if (val.includes('{')) {
                return val
                  .replace('{id}', String(imdbId || tmdbId))
                  .replace('{imdbId}', imdbId || '')
                  .replace('{tmdbId}', String(tmdbId || ''))
                  .replace('{type}', type)
              }
              const target = imdbId || tmdbId
              return `https://simkl.in/posters/${target}_m.webp`
            }
            break

          case 'omdb':
            if (imdbId) {
              return `https://img.omdbapi.com/?apikey=${val}&i=${imdbId}&h=1000`
            }
            break

          case 'fanart':
            if (imdbId || tmdbId) {
              if (val.includes('{')) {
                return val
                  .replace('{id}', String(imdbId || tmdbId))
                  .replace('{imdbId}', imdbId || '')
                  .replace('{tmdbId}', String(tmdbId || ''))
                  .replace('{type}', type)
              }
              const id = imdbId || tmdbId
              const fanartType = isMovie ? 'movies' : 'tv'
              return `https://assets.fanart.tv/fanart/${fanartType}/${id}/movieposter.jpg`
            }
            break

          case 'xrdb':
            if (imdbId || tmdbId) {
              const base = val.replace(/\/+$/, '')
              return `${base}/poster/${type}/${imdbId || tmdbId}.jpg`
            }
            break

          case 'postersplus':
            if (imdbId || tmdbId) {
              const base = val.replace(/\/+$/, '')
              return `${base}/poster/${type}/${imdbId || tmdbId}.jpg`
            }
            break
        }
      }
    }

    // Default Fallback: Standard TMDB Image
    if (!posterPath) return null
    if (posterPath.startsWith('http')) return posterPath

    const width = options?.width || 'w500'
    return `${config.tmdb.imageBaseUrl}/${width}${posterPath}`
  }

  /**
   * Resolve season-level poster specific URLs
   */
  private resolveSeasonPoster(
    provider: string,
    val: string,
    tmdbId?: number | string | null,
    imdbId?: string | null,
    season?: number
  ): string | null {
    if (!season || season <= 0) return null

    switch (provider) {
      case 'rpdb':
        if (tmdbId) {
          return `https://api.ratingposterdb.com/${val}/tmdb/poster-default/series-${tmdbId}/S${season}.jpg`
        }
        if (imdbId) {
          return `https://api.ratingposterdb.com/${val}/imdb/poster-default/${imdbId}/season/${season}.jpg`
        }
        break

      case 'topposters':
        if (tmdbId) {
          return `https://api.top-streaming.stream/${val}/tmdb/poster-default/series-${tmdbId}/S${season}.jpg`
        }
        break

      case 'easyrating': {
        const targetId = imdbId || `tmdb-${tmdbId}`
        if (val.startsWith('Tk-') || !val.startsWith('http')) {
          return `https://easyratingsdb.com/${val}/poster/${targetId}/season/${season}.jpg`
        }
        const base = val.replace(/\/+$/, '')
        return `${base}/poster/${targetId}/season/${season}.jpg`
      }

      case 'betterposters': {
        const base = val.replace(/\/+$/, '')
        return `${base}/series/${imdbId || `tmdb-${tmdbId}`}/season/${season}.jpg`
      }

      case 'xrdb': {
        const base = val.replace(/\/+$/, '')
        return `${base}/poster/series/${imdbId || tmdbId}/season/${season}.jpg`
      }

      case 'postersplus': {
        const base = val.replace(/\/+$/, '')
        return `${base}/poster/series/${imdbId || tmdbId}/season/${season}.jpg`
      }
    }

    return null
  }

  /**
   * Resolve episode still thumbnail (respecting user card drag-and-drop order for badged stills)
   */
  getEpisodeStillUrl(
    stillPath: string | null | undefined,
    options?: {
      tmdbId?: number | string | null
      season?: number | null
      episode?: number | null
      config?: PosterProviderConfig
    }
  ): string | null {
    const cfg = options?.config || {}
    const useBadged = cfg.ratingBadgedEpisodeStills ?? true
    const tmdbId = options?.tmdbId
    const season = options?.season ?? 1
    const episode = options?.episode ?? 1

    const order = cfg.providerOrder || [
      'topposters',
      'xrdb',
      'easyrating',
      'postersplus',
      'betterposters',
    ]

    if (useBadged && tmdbId && season !== null && episode !== null) {
      // Evaluate providers supporting episode stills in the user's drag-and-drop order
      for (const provider of order) {
        const val = this.getProviderValue(cfg, provider)
        if (!val) continue

        switch (provider) {
          case 'topposters':
            return `https://api.top-streaming.stream/${val}/tmdb/thumbnail/series-${tmdbId}/S${season}E${episode}.jpg`

          case 'xrdb': {
            const base = val.replace(/\/+$/, '')
            return `${base}/still/${tmdbId}/${season}/${episode}.jpg`
          }

          case 'easyrating': {
            const base = val.replace(/\/+$/, '')
            return `${base}/still/${tmdbId}/${season}/${episode}.jpg`
          }

          case 'postersplus': {
            const base = val.replace(/\/+$/, '')
            return `${base}/still/${tmdbId}/${season}/${episode}.jpg`
          }

          case 'betterposters': {
            const base = val.replace(/\/+$/, '')
            return `${base}/still/${tmdbId}/${season}/${episode}.jpg`
          }
        }
      }
    }

    // Default Fallback: Plain TMDB Episode Still
    if (!stillPath) return null
    if (stillPath.startsWith('http')) return stillPath
    return `${config.tmdb.imageBaseUrl}/w300${stillPath}`
  }

  /**
   * Backdrop resolution with fallback
   */
  getBackdropUrl(
    backdropPath: string | null | undefined,
    width: 'w780' | 'w1280' | 'original' = 'w1280'
  ): string | null {
    if (!backdropPath) return null
    if (backdropPath.startsWith('http')) return backdropPath
    return `${config.tmdb.imageBaseUrl}/${width}${backdropPath}`
  }

  /**
   * Live probe to verify a provider key or URL (powers UI 'Verify' buttons)
   */
  async verifyProvider(
    provider: string,
    keyOrUrl: string
  ): Promise<{ valid: boolean; provider: string; message: string; sampleUrl?: string }> {
    const cleanKeyOrUrl = keyOrUrl.trim()
    if (!cleanKeyOrUrl) {
      return { valid: false, provider, message: 'Value cannot be empty' }
    }

    const testImdb = 'tt0137523' // Fight Club
    const testTmdb = 550

    try {
      let sampleUrl = ''
      switch (provider.toLowerCase()) {
        case 'rpdb':
          sampleUrl = `https://api.ratingposterdb.com/${cleanKeyOrUrl}/imdb/poster-default/${testImdb}.jpg`
          break
        case 'topposters':
          sampleUrl = `https://api.top-streaming.stream/${cleanKeyOrUrl}/tmdb/poster-default/${testTmdb}.jpg`
          break
        case 'omdb':
          sampleUrl = `https://img.omdbapi.com/?apikey=${cleanKeyOrUrl}&i=${testImdb}`
          break
        case 'simkl':
          sampleUrl = `https://simkl.in/posters/${testImdb}_m.webp`
          break
        case 'fanart':
          sampleUrl = `https://assets.fanart.tv/fanart/movies/${testImdb}/movieposter.jpg`
          break
        case 'betterposters':
          if (cleanKeyOrUrl.includes('{')) {
            sampleUrl = cleanKeyOrUrl
              .replace('{id}', testImdb)
              .replace('{imdbId}', testImdb)
              .replace('{imdb_id}', testImdb)
              .replace('{tmdbId}', String(testTmdb))
              .replace('{tmdb_id}', String(testTmdb))
              .replace('{type}', 'movie')
          } else {
            sampleUrl = `${cleanKeyOrUrl.replace(/\/+$/, '')}/movie/${testImdb}.jpg`
          }
          break
        case 'easyrating':
          if (cleanKeyOrUrl.startsWith('Tk-') || !cleanKeyOrUrl.startsWith('http')) {
            sampleUrl = `https://easyratingsdb.com/${cleanKeyOrUrl}/poster/${testImdb}.jpg`
          } else if (cleanKeyOrUrl.includes('{')) {
            sampleUrl = cleanKeyOrUrl
              .replace('{id}', testImdb)
              .replace('{imdbId}', testImdb)
              .replace('{imdb_id}', testImdb)
              .replace('{tmdbId}', String(testTmdb))
              .replace('{tmdb_id}', String(testTmdb))
              .replace('{type}', 'movie')
          } else {
            sampleUrl = `${cleanKeyOrUrl.replace(/\/+$/, '')}/poster/${testImdb}.jpg`
          }
          break
        case 'xrdb':
          sampleUrl = cleanKeyOrUrl.includes('{id}')
            ? cleanKeyOrUrl.replace('{id}', testImdb)
            : `${cleanKeyOrUrl.replace(/\/+$/, '')}/poster/movie/${testImdb}.jpg`
          break
        case 'postersplus':
          sampleUrl = cleanKeyOrUrl.includes('{id}')
            ? cleanKeyOrUrl.replace('{id}', testImdb)
            : `${cleanKeyOrUrl.replace(/\/+$/, '')}/poster/movie/${testImdb}.jpg`
          break
        case 'custom':
          sampleUrl = cleanKeyOrUrl
            .replace('{id}', testImdb)
            .replace('{imdbId}', testImdb)
            .replace('{imdb_id}', testImdb)
            .replace('{tmdbId}', String(testTmdb))
            .replace('{tmdb_id}', String(testTmdb))
            .replace('{type}', 'movie')
          break
        default:
          sampleUrl = cleanKeyOrUrl
      }

      // Live HEAD or GET probe with 3.5 second timeout
      const res = await fetch(sampleUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3500),
      }).catch(async () => {
        return fetch(sampleUrl, {
          method: 'GET',
          headers: { Range: 'bytes=0-100' },
          signal: AbortSignal.timeout(3500),
        })
      })

      if (res.ok || res.status === 206 || res.status === 302 || res.status === 301) {
        return {
          valid: true,
          provider,
          message: 'Provider verified successfully',
          sampleUrl,
        }
      }

      return {
        valid: false,
        provider,
        message: `Provider probe returned HTTP ${res.status}`,
        sampleUrl,
      }
    } catch (err: any) {
      return {
        valid: false,
        provider,
        message: err.message || 'Verification failed',
      }
    }
  }
}

export const posterEngineService = new PosterEngineService()

// Backward-compatible exports
export const getPosterUrl = (posterPath: any, options?: any) =>
  posterEngineService.getPosterUrl(posterPath, options)

export const getBackdropUrl = (backdropPath: any, width?: any) =>
  posterEngineService.getBackdropUrl(backdropPath, width)
