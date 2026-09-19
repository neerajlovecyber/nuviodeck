import { config } from '../config'
import { getPosterUrl } from './posters'

interface MdbListEntry {
  id: number
  imdb_id?: string
  tmdb_id?: number
  title?: string
  name?: string
  release_year?: number | string
  poster?: string
  mediatype?: 'movie' | 'show'
  score?: number
  description?: string
}

const cache = new Map<string, { data: any; expiresAt: number }>()

export class MdbListService {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || config.mdblist.apiKey
    this.baseUrl = config.mdblist.baseUrl
  }

  async fetchListItems(listSlug: string, options?: { page?: number; rpdbKey?: string }): Promise<any[]> {
    const page = options?.page || 1
    const cacheKey = `mdblist:${listSlug}:${page}`

    const cached = cache.get(cacheKey)
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data
    }

    try {
      // Clean up listSlug (e.g., 'snoak/todays-most-popular-movies')
      const cleanSlug = listSlug.replace(/^mdblist\./, '').replace(/^\/+/, '')
      
      const url = new URL(`https://mdblist.com/lists/${cleanSlug}/json`)
      if (this.apiKey) {
        url.searchParams.set('apikey', this.apiKey)
      }

      const res = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Nuviodeck-Engine/1.0.0',
        },
      })

      if (!res.ok) {
        throw new Error(`MDBList responded with ${res.status}`)
      }

      const items: MdbListEntry[] = await res.json()
      if (!Array.isArray(items)) return []

      // Paginate locally (20 per page)
      const pageSize = 20
      const startIndex = (page - 1) * pageSize
      const pageItems = items.slice(startIndex, startIndex + pageSize)

      const metas = pageItems.map((item) => {
        const isMovie = item.mediatype === 'movie' || (!item.mediatype && !item.name)
        const id = item.imdb_id || (item.tmdb_id ? `tmdb:${item.tmdb_id}` : `mdblist:${item.id}`)
        const title = item.title || item.name || 'Untitled'
        const poster = item.poster || getPosterUrl(null, {
          imdbId: item.imdb_id,
          tmdbId: item.tmdb_id,
          type: isMovie ? 'movie' : 'series',
          rpdbKey: options?.rpdbKey,
        })

        return {
          id,
          type: isMovie ? 'movie' : 'series',
          name: title,
          poster,
          posterShape: 'poster',
          description: item.description || '',
          releaseInfo: String(item.release_year || ''),
          imdbRating: item.score ? Number((item.score / 10).toFixed(1)) : undefined,
        }
      })

      cache.set(cacheKey, { data: metas, expiresAt: Date.now() + 15 * 60 * 1000 })
      return metas
    } catch (err: any) {
      console.error(`Failed to fetch MDBList items for ${listSlug}:`, err.message)
      return []
    }
  }
}
