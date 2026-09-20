/**
 * Anime Filler Checker Service
 * Categorizes anime episodes as:
 * - Manga Canon (green)
 * - Mixed Canon (blue)
 * - Anime Canon (purple)
 * - Filler (orange/red)
 */

export type FillerStatus = 'Manga Canon' | 'Mixed Canon' | 'Anime Canon' | 'Filler' | 'Unknown'

export interface EpisodeFillerInfo {
  episode: number
  title: string
  status: FillerStatus
  airDate?: string
}

export interface AnimeFillerData {
  title: string
  slug: string
  episodes: Map<number, EpisodeFillerInfo>
  fillerPercentage?: number
  lastUpdated: number
}

const cache = new Map<string, AnimeFillerData>()
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

export class AnimeFillerService {
  /**
   * Builds standardized slug for AnimeFillerList URL
   */
  static buildSlug(animeName: string): string {
    return animeName
      .toLowerCase()
      .replace(/['']/g, '')
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  /**
   * Fetches filler breakdown for an anime title
   */
  static async getFillerData(animeTitle: string): Promise<AnimeFillerData | null> {
    const slug = this.buildSlug(animeTitle)
    const cached = cache.get(slug)
    if (cached && Date.now() - cached.lastUpdated < CACHE_TTL) {
      return cached
    }

    try {
      const url = `https://www.animefillerlist.com/shows/${slug}`
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(4000),
      })

      if (!res.ok) {
        return null
      }

      const html = await res.text()
      const episodes = new Map<number, EpisodeFillerInfo>()

      // Extract rows using regex from table class="EpisodeList"
      const rowRegex = /<tr class="([^"]*)">\s*<td class="Number">(\d+)<\/td>\s*<td class="Title"><a[^>]*>([^<]+)<\/a><\/td>\s*<td class="Type"><span class="([^"]+)">([^<]+)<\/span><\/td>/g
      let match: RegExpExecArray | null

      while ((match = rowRegex.exec(html)) !== null) {
        const epNum = parseInt(match[2], 10)
        const title = match[3].trim()
        const rawStatus = match[5].trim()

        let status: FillerStatus = 'Unknown'
        if (rawStatus.includes('Manga Canon')) status = 'Manga Canon'
        else if (rawStatus.includes('Mixed')) status = 'Mixed Canon'
        else if (rawStatus.includes('Anime Canon')) status = 'Anime Canon'
        else if (rawStatus.includes('Filler')) status = 'Filler'

        episodes.set(epNum, {
          episode: epNum,
          title,
          status,
        })
      }

      const data: AnimeFillerData = {
        title: animeTitle,
        slug,
        episodes,
        lastUpdated: Date.now(),
      }

      cache.set(slug, data)
      return data
    } catch {
      return null
    }
  }

  /**
   * Checks filler status of a specific episode index
   */
  static async checkEpisode(animeTitle: string, episodeNumber: number): Promise<EpisodeFillerInfo | null> {
    const data = await this.getFillerData(animeTitle)
    if (!data) return null
    return data.episodes.get(episodeNumber) || null
  }
}
