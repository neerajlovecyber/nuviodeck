import { Hono } from 'hono'

export const postersRouter = new Hono()

// Poster overlay / proxy status
postersRouter.get('/status', (c) => {
  return c.json({
    status: 'ok',
    features: ['rpdb_ratings', 'clean_logos', 'gradient_backdrop', 'custom_badges'],
  })
})

// Resolve poster with dynamic badge / rating overlay
postersRouter.get('/render', (c) => {
  const tmdbId = c.req.query('tmdbId')
  const style = c.req.query('style') || 'standard'

  if (!tmdbId) {
    return c.json({ error: 'tmdbId is required' }, 400)
  }

  return c.json({
    tmdbId,
    style,
    posterUrl: `https://image.tmdb.org/t/p/w500/${tmdbId}.jpg`,
  })
})
