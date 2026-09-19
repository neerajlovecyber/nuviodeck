import differentOrder from '../data/different-order.json'
import differentImdbId from '../data/different-imdb-id.json'
import { config } from '../config'

interface DifferentOrderItem {
  tmdbId: string
  episodeGroupId: string
  name: string
  watchOrderOnly?: boolean
}

interface DifferentImdbItem {
  tmdbId: string
  imdbId: string
  name: string
}

const ordersMap = new Map<string, DifferentOrderItem>()
for (const item of (differentOrder as DifferentOrderItem[])) {
  ordersMap.set(String(item.tmdbId), item)
}

const imdbMap = new Map<string, DifferentImdbItem>()
for (const item of (differentImdbId as DifferentImdbItem[])) {
  imdbMap.set(String(item.tmdbId), item)
}

export function getCustomEpisodeGroup(tmdbId: string | number): DifferentOrderItem | undefined {
  return ordersMap.get(String(tmdbId))
}

export function getCustomImdbId(tmdbId: string | number): string | undefined {
  return imdbMap.get(String(tmdbId))?.imdbId
}

export interface EpisodeGroupEpisode {
  id: number
  name: string
  overview: string
  episode_number: number
  season_number: number
  still_path: string | null
  air_date: string | null
}

export interface EpisodeGroupSeason {
  id: string
  name: string
  order: number
  episodes: EpisodeGroupEpisode[]
}

export interface EpisodeGroupResponse {
  id: string
  name: string
  description: string
  episode_count: number
  group_count: number
  groups: EpisodeGroupSeason[]
}

const groupCache = new Map<string, { data: EpisodeGroupResponse | null; expires: number }>()
const GROUP_TTL = 12 * 60 * 60 * 1000 // 12 hours

export async function fetchEpisodeGroup(
  episodeGroupId: string,
  tmdbKey?: string,
  proxyUrl?: string
): Promise<EpisodeGroupResponse | null> {
  const cached = groupCache.get(episodeGroupId)
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

    const url = new URL(`${baseUrl}/tv/episode_group/${episodeGroupId}`)
    if (!isToken && key) {
      url.searchParams.set('api_key', key)
    }

    const res = await fetch(url.toString(), { headers })
    if (!res.ok) {
      groupCache.set(episodeGroupId, { data: null, expires: Date.now() + 60 * 60 * 1000 })
      return null
    }

    const data = (await res.json()) as EpisodeGroupResponse
    groupCache.set(episodeGroupId, { data, expires: Date.now() + GROUP_TTL })
    return data
  } catch (err) {
    console.error(`Error fetching episode group ${episodeGroupId}:`, err)
    return null
  }
}
