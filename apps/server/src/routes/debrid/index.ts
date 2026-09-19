import { Hono } from 'hono'

export const debridRouter = new Hono()

// Check supported debrid services and user status
debridRouter.get('/providers', (c) => {
  return c.json({
    providers: [
      { id: 'realdebrid', name: 'Real-Debrid', supported: true },
      { id: 'torbox', name: 'Torbox', supported: true },
      { id: 'alldebrid', name: 'AllDebrid', supported: true },
      { id: 'premiumize', name: 'Premiumize.me', supported: true },
    ],
  })
})

// Validate an API token for a specific provider
debridRouter.post('/validate', async (c) => {
  const { provider, token } = await c.req.json().catch(() => ({}))
  if (!provider || !token) {
    return c.json({ error: 'provider and token are required' }, 400)
  }

  // Token verification placeholder
  return c.json({
    provider,
    valid: true,
    message: 'Token configured successfully',
  })
})
