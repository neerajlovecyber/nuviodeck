import { Hono } from 'hono'

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

// Search media across providers
metadataRouter.get('/search', async (c) => {
  const query = c.req.query('q')
  const type = c.req.query('type') || 'all' // movie, series, all

  if (!query) {
    return c.json({ error: 'Search query "q" is required' }, 400)
  }

  // Placeholder provider aggregator
  return c.json({
    query,
    type,
    results: [],
  })
})
