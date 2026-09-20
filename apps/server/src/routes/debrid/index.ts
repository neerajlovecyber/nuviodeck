import { Hono } from 'hono'
import { debridService } from '../../services/debrid'

export const debridRouter = new Hono()

// Check supported debrid services and user status
debridRouter.get('/providers', (c) => {
  return c.json({
    providers: [
      { id: 'realdebrid', name: 'Real-Debrid', supported: true },
      { id: 'torbox', name: 'Torbox', supported: true },
      { id: 'alldebrid', name: 'AllDebrid', supported: true },
      { id: 'premiumize', name: 'Premiumize.me', supported: true },
      { id: 'debridlink', name: 'Debrid-Link', supported: true },
      { id: 'offcloud', name: 'Offcloud', supported: true },
      { id: 'easydebrid', name: 'EasyDebrid', supported: true },
    ],
  })
})

// Check health and expiry across multiple debrid keys
debridRouter.post('/health', async (c) => {
  const { keys } = await c.req.json().catch(() => ({}))
  if (!keys || typeof keys !== 'object') {
    return c.json({ error: 'keys object is required' }, 400)
  }

  const report = await debridService.checkHealth(keys)
  return c.json({ report })
})

// Validate an API token for a specific provider
debridRouter.post('/validate', async (c) => {
  const { provider, token } = await c.req.json().catch(() => ({}))
  if (!provider || !token) {
    return c.json({ error: 'provider and token are required' }, 400)
  }

  const result = await debridService.validateToken(provider, token)
  if (!result.valid) {
    return c.json(result, 400)
  }

  return c.json({
    ...result,
    message: `${result.provider} token verified successfully`,
  })
})
