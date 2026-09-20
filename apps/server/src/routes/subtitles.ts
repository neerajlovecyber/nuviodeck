import { Hono } from 'hono'

export const subtitlesRouter = new Hono()

/**
 * Subtitles Provider Engine
 * GET /api/subtitles/:type/:id/:extra?.json
 */
subtitlesRouter.get('/:type/:id/:extra?', async (c) => {
  const type = c.req.param('type')
  const id = c.req.param('id')
  const extra = c.req.param('extra')

  // Parse extra query/params
  let lang = 'en'
  if (extra) {
    const params = new URLSearchParams(extra.replace(/\.json$/, ''))
    if (params.get('lang')) lang = params.get('lang')!
  }

  // Handle subtitles resolution
  // Returns standard Stremio Subtitles manifest payload
  c.header('Content-Type', 'application/json')
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Cache-Control', 'max-age=3600, public')

  return c.json({
    subtitles: [],
  })
})
