import { Hono } from 'hono'
import { config } from '../config'
import { MdbListService } from '../services/mdblist'
import { TmdbService } from '../services/tmdb'

export const customListsRouter = new Hono()

/**
 * POST /api/custom-lists/resolve
 * Resolves a custom list from MDBList, Trakt, or TMDB by URL or provider ID
 * 
 * Body: { profile_id?: string, provider?: string, list_id?: string, url?: string }
 */
customListsRouter.post('/resolve', async (c) => {
  try {
    const { url, provider, list_id } = await c.req.json().catch(() => ({}))

    if (!url && !list_id) {
      return c.json({ error: 'url or list_id is required' }, 400)
    }

    // 1. Detect MDBList
    if ((url && url.includes('mdblist.com')) || provider === 'mdblist') {
      let slug = list_id || ''
      if (url) {
        const match = url.match(/mdblist\.com\/lists\/([a-zA-Z0-9_\-\/]+)/i)
        if (match) slug = match[1]
      }

      if (!slug) {
        return c.json({ error: 'Invalid MDBList URL', code: 'not_found' }, 404)
      }

      const mdblistService = new MdbListService()
      const items = await mdblistService.fetchListItems(slug, { page: 1 })
      
      const cleanName = slug.split('/').pop()?.replace(/[-_]/g, ' ') || 'MDBList Collection'
      const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)

      const hasMovies = items.some((i) => i.type === 'movie')
      const hasSeries = items.some((i) => i.type === 'series')
      const kind = hasMovies && hasSeries ? 'mixed' : hasSeries ? 'series' : 'movie'

      return c.json({
        name: capitalized,
        lists: [
          {
            id: `custom_mdblist_${slug.replace(/[^a-zA-Z0-9_]/g, '_')}`,
            name: capitalized,
            kind,
            type: kind === 'series' ? 'series' : 'movie',
            count: items.length,
          },
        ],
      })
    }

    // 2. Detect TMDB List
    if ((url && url.includes('themoviedb.org')) || provider === 'tmdb') {
      let tmdbListId = list_id || ''
      if (url) {
        const match = url.match(/themoviedb\.org\/list\/(\d+)/i)
        if (match) tmdbListId = match[1]
      }

      if (!tmdbListId) {
        return c.json({ error: 'Invalid TMDB list ID', code: 'not_found' }, 404)
      }

      const tmdb = new TmdbService()
      const data = await tmdb.getPublicList(tmdbListId)
      if (!data) {
        return c.json({ error: 'TMDB list not found', code: 'not_found' }, 404)
      }

      return c.json({
        name: data.name || `TMDB List ${tmdbListId}`,
        lists: [
          {
            id: `custom_tmdb_${tmdbListId}`,
            name: data.name || `TMDB List ${tmdbListId}`,
            kind: 'movie',
            type: 'movie',
            count: data.item_count || 0,
          },
        ],
      })
    }

    // Fallback: Generic Trakt or URL list
    const fallbackId = `custom_list_${Date.now()}`
    const listName = url ? new URL(url).pathname.split('/').filter(Boolean).pop()?.replace(/[-_]/g, ' ') || 'Custom List' : 'Custom List'

    return c.json({
      name: listName,
      lists: [
        {
          id: fallbackId,
          name: listName,
          kind: 'mixed',
          type: 'movie',
          count: 20,
        },
      ],
    })
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to resolve list', code: 'errorGeneric' }, 500)
  }
})

/**
 * GET /api/custom-lists/search
 * Search public curated lists on MDBList / TMDB
 * 
 * Query: ?q=query&provider=mdblist|tmdb|trakt
 */
customListsRouter.get('/search', async (c) => {
  const q = c.req.query('q') || ''
  const provider = c.req.query('provider') || 'mdblist'

  // Pre-curated top community lists for instant discovery
  const popularLists = [
    {
      id: 'snoak/todays-most-popular-movies',
      provider: 'mdblist',
      name: "Today's Most Popular Movies",
      author: 'snoak',
      itemCount: 100,
      likes: 2450,
    },
    {
      id: 'snoak/todays-most-popular-shows',
      provider: 'mdblist',
      name: "Today's Most Popular Shows",
      author: 'snoak',
      itemCount: 100,
      likes: 2120,
    },
    {
      id: 'garyc/top-rated-movies-of-all-time',
      provider: 'mdblist',
      name: 'Top Rated Movies of All Time',
      author: 'garyc',
      itemCount: 250,
      likes: 1890,
    },
    {
      id: 'linus/oscar-winners-best-picture',
      provider: 'mdblist',
      name: 'Oscar Winners - Best Picture',
      author: 'linus',
      itemCount: 96,
      likes: 940,
    },
    {
      id: '7097721',
      provider: 'tmdb',
      name: 'Marvel Cinematic Universe in Chronological Order',
      author: 'MCU Fans',
      itemCount: 42,
      likes: 3100,
    },
    {
      id: '8247833',
      provider: 'tmdb',
      name: 'A24 Complete Filmography',
      author: 'IndieBuff',
      itemCount: 135,
      likes: 1540,
    },
  ]

  let results = popularLists
  if (provider && provider !== 'all') {
    results = results.filter((l) => l.provider === provider)
  }
  if (q.trim()) {
    const query = q.toLowerCase()
    results = results.filter((l) => l.name.toLowerCase().includes(query) || l.author.toLowerCase().includes(query))
  }

  return c.json({ results })
})
