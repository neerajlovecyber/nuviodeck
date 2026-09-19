import { Hono } from 'hono'
import { nuvioClient } from '../../lib/nuvio-client'
import { resolveAccessToken } from './auth'

export const syncRouter = new Hono()

// Get sync overview counts across profiles
syncRouter.get('/overview', async (c) => {
  try {
    const token = await resolveAccessToken(c)
    const overview = await nuvioClient.getSyncOverview(token)
    return c.json({ overview })
  } catch (err: any) {
    return c.json(
      { error: err.message || 'Failed to fetch sync overview', details: err.details },
      err.status || 500
    )
  }
})

// Ping Nuvio database health
syncRouter.get('/health', async (c) => {
  try {
    const isAlive = await nuvioClient.healthPing()
    return c.json({
      status: isAlive ? 'healthy' : 'unreachable',
      connected: isAlive,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return c.json(
      {
        status: 'error',
        connected: false,
        error: err.message || 'Health check failed',
      },
      503
    )
  }
})
