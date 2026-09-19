import { config } from '../config'

interface ReleaseDateEntry {
  certification: string
  iso_639_1: string
  note: string
  release_date: string
  type: number // 1: Premiere, 2: Theatrical (limited), 3: Theatrical, 4: Digital, 5: Physical, 6: TV
}

interface ReleaseDatesResponse {
  id: number
  results: Array<{
    iso_3166_1: string
    release_dates: ReleaseDateEntry[]
  }>
}

const releaseCache = new Map<number, { data: ReleaseDatesResponse | null; expires: number }>()
const RELEASE_TTL = 6 * 60 * 60 * 1000 // 6 hours

export async function getMovieReleaseDates(
  movieId: number,
  tmdbKey?: string,
  proxyUrl?: string
): Promise<ReleaseDatesResponse | null> {
  const cached = releaseCache.get(movieId)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }

  try {
    const key = tmdbKey || config.tmdb.apiToken || config.tmdb.apiKey
    const baseUrl = proxyUrl || config.tmdb.baseUrl
    const isToken = key.length > 50

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    }
    if (isToken) {
      headers['Authorization'] = `Bearer ${key}`
    }

    const url = new URL(`${baseUrl}/movie/${movieId}/release_dates`)
    if (!isToken && key) {
      url.searchParams.set('api_key', key)
    }

    const res = await fetch(url.toString(), { headers })
    if (!res.ok) {
      releaseCache.set(movieId, { data: null, expires: Date.now() + 60 * 60 * 1000 })
      return null
    }

    const data = (await res.json()) as ReleaseDatesResponse
    releaseCache.set(movieId, { data, expires: Date.now() + RELEASE_TTL })
    return data
  } catch (err) {
    console.error(`Error fetching release dates for movie ${movieId}:`, err)
    return null
  }
}

/**
 * Check if a movie has been released digitally (globally in any region: Digital 4, Physical 5, TV 6)
 */
export async function isMovieReleasedDigitally(
  movieId: number,
  tmdbKey?: string,
  proxyUrl?: string
): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const releaseDates = await getMovieReleaseDates(movieId, tmdbKey, proxyUrl)

    if (!releaseDates || !releaseDates.results) return true // Default pass if unknown

    const digitalReleaseTypes = [4, 5, 6]

    for (const regionData of releaseDates.results) {
      if (!regionData.release_dates) continue

      const hasDigitalRelease = regionData.release_dates.some((rd) => {
        const dateStr = rd.release_date ? rd.release_date.split('T')[0] : null
        if (!dateStr) return false
        return dateStr <= today && digitalReleaseTypes.includes(rd.type)
      })

      if (hasDigitalRelease) return true
    }

    return false
  } catch {
    return true
  }
}

/**
 * Check if a movie has been officially released in a specific region (Theatrical, Digital, Physical, TV)
 */
export async function isMovieReleasedInRegion(
  movieId: number,
  region: string,
  tmdbKey?: string,
  proxyUrl?: string
): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const releaseDates = await getMovieReleaseDates(movieId, tmdbKey, proxyUrl)

    if (!releaseDates || !releaseDates.results) return true

    const regionRelease = releaseDates.results.find((r) => r.iso_3166_1 === region)
    if (!regionRelease || !regionRelease.release_dates) return false

    const validReleaseTypes = [3, 4, 5, 6]
    return regionRelease.release_dates.some((rd) => {
      const dateStr = rd.release_date ? rd.release_date.split('T')[0] : null
      if (!dateStr) return false
      return dateStr <= today && validReleaseTypes.includes(rd.type)
    })
  } catch {
    return true
  }
}
