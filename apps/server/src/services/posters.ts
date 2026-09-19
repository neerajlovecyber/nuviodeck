import { config } from '../config'

export function getPosterUrl(
  posterPath: string | null | undefined,
  options?: {
    imdbId?: string | null
    tmdbId?: number | string | null
    type?: 'movie' | 'series'
    rpdbKey?: string | null
    width?: 'w300' | 'w500' | 'w780' | 'original'
  }
): string | null {
  const rpdbKey = options?.rpdbKey || config.rpdb.apiKey

  // If user has RPDB key and we have an IMDb ID or TMDB ID
  if (rpdbKey) {
    if (options?.imdbId) {
      return `https://api.ratingposterdb.com/${rpdbKey}/imdb/poster-default/${options.imdbId}.jpg`
    }
    if (options?.tmdbId) {
      return `https://api.ratingposterdb.com/${rpdbKey}/tmdb/poster-default/${options.tmdbId}.jpg`
    }
  }

  if (!posterPath) return null
  if (posterPath.startsWith('http')) return posterPath

  const width = options?.width || 'w500'
  return `${config.tmdb.imageBaseUrl}/${width}${posterPath}`
}

export function getBackdropUrl(
  backdropPath: string | null | undefined,
  width: 'w780' | 'w1280' | 'original' = 'w1280'
): string | null {
  if (!backdropPath) return null
  if (backdropPath.startsWith('http')) return backdropPath
  return `${config.tmdb.imageBaseUrl}/${width}${backdropPath}`
}
