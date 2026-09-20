import { Hono } from 'hono'
import { StreamingProviderService, STREAMING_REGIONS } from '../services/streaming-providers'
import { AgeRatingService } from '../services/age-ratings'

export const streamingProvidersRouter = new Hono()

// GET /api/streaming-providers
streamingProvidersRouter.get('/', (c) => {
  const region = c.req.query('region')
  if (region) {
    const providers = StreamingProviderService.getByRegion(region)
    return c.json({ region, providers })
  }

  return c.json({
    providers: StreamingProviderService.getAll(),
    regions: STREAMING_REGIONS,
  })
})

// GET /api/streaming-providers/regions
streamingProvidersRouter.get('/regions', (c) => {
  return c.json({
    regions: StreamingProviderService.getRegions(),
  })
})

// GET /api/streaming-providers/age-ratings
streamingProvidersRouter.get('/age-ratings', (c) => {
  return c.json({
    ratings: AgeRatingService.getAll(),
  })
})
