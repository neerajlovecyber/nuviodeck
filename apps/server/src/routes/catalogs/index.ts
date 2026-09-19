import { Hono } from 'hono'

export const catalogsRouter = new Hono()

// Catalog status and list of configured custom catalogs
catalogsRouter.get('/', (c) => {
  return c.json({
    catalogs: [
      {
        id: 'popular_movies',
        name: 'Popular Movies',
        type: 'movie',
        source: 'tmdb',
      },
      {
        id: 'trending_series',
        name: 'Trending TV Series',
        type: 'series',
        source: 'tmdb',
      },
      {
        id: 'trakt_watchlist',
        name: 'Trakt Watchlist',
        type: 'all',
        source: 'trakt',
      },
    ],
  })
})

// Generate / serve dynamic Stremio/Nuvio compatible manifest
catalogsRouter.get('/manifest.json', (c) => {
  const manifest = {
    id: 'org.nuviodeck.deck',
    version: '1.0.0',
    name: 'Nuviodeck Curated Engine',
    description: 'Dynamic unified catalogs, smart debrid streams & badges',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie', 'series'],
    catalogs: [
      {
        type: 'movie',
        id: 'nuvio_popular_movies',
        name: 'Nuviodeck: Popular Movies',
      },
      {
        type: 'series',
        id: 'nuvio_trending_series',
        name: 'Nuviodeck: Trending TV',
      },
    ],
  }

  c.header('Content-Type', 'application/json')
  c.header('Access-Control-Allow-Origin', '*')
  return c.json(manifest)
})
