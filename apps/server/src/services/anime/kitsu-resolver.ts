/**
 * Kitsu Anime Resolver Service
 * Maps Season + Episode to Absolute Episode numbering and queries Kitsu API
 */

export interface KitsuEpisode {
  id: string
  number: number
  title?: string
  description?: string
  airdate?: string
  thumbnail?: string
}

export interface KitsuAnimeMeta {
  kitsuId: number
  canonicalTitle: string
  titles: {
    en?: string
    en_jp?: string
    ja_jp?: string
  }
  episodeCount?: number
  episodes: KitsuEpisode[]
}

const kitsuCache = new Map<string, { data: KitsuAnimeMeta | null; timestamp: number }>()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

export class KitsuResolverService {
  /**
   * Fetches anime metadata from Kitsu API by kitsu ID
   */
  static async getKitsuAnime(kitsuId: number): Promise<KitsuAnimeMeta | null> {
    const key = `kitsu:${kitsuId}`
    const cached = kitsuCache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }

    try {
      const url = `https://kitsu.io/api/edge/anime/${kitsuId}?include=episodes`
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
        signal: AbortSignal.timeout(4000),
      })

      if (!res.ok) {
        kitsuCache.set(key, { data: null, timestamp: Date.now() })
        return null
      }

      const json: any = await res.json()
      const attr = json.data?.attributes || {}
      const included = (json.included || []).filter((i: any) => i.type === 'episodes')

      const episodes: KitsuEpisode[] = included.map((ep: any) => ({
        id: ep.id,
        number: ep.attributes?.number || 1,
        title: ep.attributes?.canonicalTitle || ep.attributes?.titles?.en_jp || `Episode ${ep.attributes?.number}`,
        description: ep.attributes?.synopsis || '',
        airdate: ep.attributes?.airdate || '',
        thumbnail: ep.attributes?.thumbnail?.original || '',
      }))

      const meta: KitsuAnimeMeta = {
        kitsuId,
        canonicalTitle: attr.canonicalTitle || '',
        titles: {
          en: attr.titles?.en,
          en_jp: attr.titles?.en_jp,
          ja_jp: attr.titles?.ja_jp,
        },
        episodeCount: attr.episodeCount,
        episodes,
      }

      kitsuCache.set(key, { data: meta, timestamp: Date.now() })
      return meta
    } catch {
      return null
    }
  }

  /**
   * Search Kitsu for an anime title
   */
  static async searchKitsu(title: string): Promise<KitsuAnimeMeta | null> {
    const key = `search:${title.toLowerCase()}`
    const cached = kitsuCache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }

    try {
      const url = `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(title)}&page[limit]=1`
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.api+json',
        },
        signal: AbortSignal.timeout(4000),
      })

      if (!res.ok) return null
      const json: any = await res.json()
      const first = json.data?.[0]
      if (!first) return null

      return this.getKitsuAnime(Number(first.id))
    } catch {
      return null
    }
  }
}
