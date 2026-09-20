import { Hono } from 'hono'
import { TmdbService } from '../../services/tmdb'
import { AiSearchService } from '../../services/ai-search'

export const metadataRouter = new Hono()

// Health / status of metadata providers
metadataRouter.get('/status', (c) => {
  return c.json({
    status: 'ok',
    providers: {
      tmdb: { enabled: true, configured: Boolean(process.env.TMDB_API_KEY) },
      imdb: { enabled: true },
      trakt: { enabled: true, configured: Boolean(process.env.TRAKT_CLIENT_ID) },
      rpdb: { enabled: true, configured: Boolean(process.env.RPDB_API_KEY) },
    },
  })
})

// Search media across providers (TMDB + AI)
metadataRouter.get('/search', async (c) => {
  const query = c.req.query('q')
  const typeParam = c.req.query('type') || 'all' // movie, series, all
  const mode = c.req.query('mode') || 'auto' // standard, ai, auto
  const page = parseInt(c.req.query('page') || '1', 10)

  if (!query) {
    return c.json({ error: 'Search query "q" is required' }, 400)
  }

  const tmdb = new TmdbService()
  const aiSearch = new AiSearchService(undefined, tmdb)

  try {
    // If explicit AI mode requested
    if (mode === 'ai') {
      const results = await aiSearch.searchWithAi(
        query,
        typeParam === 'series' ? 'series' : 'movie'
      )
      return c.json({
        query,
        type: typeParam,
        mode: 'ai',
        results,
      })
    }

    // Standard TMDB search
    const tmdbType = typeParam === 'movie' ? 'movie' : typeParam === 'series' ? 'tv' : 'multi'
    const searchRes = await tmdb.search(query, tmdbType, page)

    const results = (searchRes.results || [])
      .filter((item) => item.media_type !== 'person' || typeParam === 'all')
      .map((item) => {
        const itemType = item.media_type === 'tv' || item.first_air_date ? 'series' : 'movie'
        return tmdb.formatMetaPreview(item, itemType)
      })

    return c.json({
      query,
      type: typeParam,
      page: searchRes.page || page,
      totalPages: searchRes.total_pages || 1,
      results,
    })
  } catch (err: any) {
    console.error('Metadata search failed:', err.message)
    return c.json({ error: 'Search failed', details: err.message, results: [] }, 500)
  }
})
