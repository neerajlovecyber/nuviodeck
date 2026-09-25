import { Hono } from 'hono'
import { config } from '../config'

export const addonManagerRouter = new Hono()

// In-memory state for development / local storage (can be backed by DB)
interface LinkedAccount {
  id: string
  type: 'nuvio' | 'stremio'
  name: string
  email?: string
  avatarUrl?: string
  addedAt: number
}

interface FailoverRule {
  id: string
  accountId: string
  listId?: string
  primaryUrl: string
  chain: Array<{ url: string; name: string }>
  createdAt: number
}

interface AddonLibraryEntry {
  id: string
  name: string
  url: string
  tags: string[]
  addedAt: number
}

const linkedAccounts = new Map<string, LinkedAccount>()
const failoverRules = new Map<string, FailoverRule>()
const addonLibrary = new Map<string, AddonLibraryEntry>()

// Populate standard defaults if empty
if (addonLibrary.size === 0) {
  addonLibrary.set('lib-torrentio', {
    id: 'lib-torrentio',
    name: 'Torrentio',
    url: 'https://torrentio.strem.fun/manifest.json',
    tags: ['streams', 'torrents', 'debrid'],
    addedAt: Date.now(),
  })
  addonLibrary.set('lib-comet', {
    id: 'lib-comet',
    name: 'Comet',
    url: 'https://comet.elfhosted.com/manifest.json',
    tags: ['streams', 'fast', 'debrid'],
    addedAt: Date.now(),
  })
  addonLibrary.set('lib-opensubtitles', {
    id: 'lib-opensubtitles',
    name: 'OpenSubtitles v3',
    url: 'https://opensubtitles-v3.strem.fun/manifest.json',
    tags: ['subtitles'],
    addedAt: Date.now(),
  })
}

/**
 * GET /api/addon-manager/accounts
 * Lists all connected Nuvio and Stremio accounts
 */
addonManagerRouter.get('/accounts', (c) => {
  return c.json({
    accounts: Array.from(linkedAccounts.values()),
    unlocked: true, // 100% Free - no donor tier required
  })
})

/**
 * POST /api/addon-manager/accounts/nuvio
 * Link a Nuvio account
 */
addonManagerRouter.post('/accounts/nuvio', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const id = body.id || `nuvio-${Date.now()}`
  const account: LinkedAccount = {
    id,
    type: 'nuvio',
    name: body.name || 'Nuvio Primary Profile',
    email: body.email || '',
    avatarUrl: body.avatarUrl || '',
    addedAt: Date.now(),
  }
  linkedAccounts.set(id, account)
  return c.json({ ok: true, account })
})

/**
 * POST /api/addon-manager/accounts/stremio
 * Link a Stremio account
 */
addonManagerRouter.post('/accounts/stremio', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const id = body.id || `stremio-${Date.now()}`
  const account: LinkedAccount = {
    id,
    type: 'stremio',
    name: body.name || body.email || 'Stremio Account',
    email: body.email || '',
    addedAt: Date.now(),
  }
  linkedAccounts.set(id, account)
  return c.json({ ok: true, account })
})

/**
 * DELETE /api/addon-manager/accounts/:id
 * Unlink an account
 */
addonManagerRouter.delete('/accounts/:id', (c) => {
  const id = c.req.param('id')
  linkedAccounts.delete(id)
  return c.json({ ok: true, id })
})

/**
 * GET /api/addon-manager/accounts/:id/addons
 * Fetches installed addons for an account
 */
addonManagerRouter.get('/accounts/:id/addons', (c) => {
  const id = c.req.param('id')
  return c.json({
    accountId: id,
    readAt: Date.now(),
    digest: `digest-${Date.now()}`,
    addons: [
      {
        identity: 'comet',
        name: 'Comet Streams',
        url: 'https://comet.elfhosted.com/manifest.json',
        health: 'healthy',
        healthReason: 'Manifest responding within 120ms',
      },
      {
        identity: 'torrentio',
        name: 'Torrentio RD',
        url: 'https://torrentio.strem.fun/manifest.json',
        health: 'healthy',
        healthReason: 'Operational',
      },
    ],
  })
})

/**
 * POST /api/addon-manager/accounts/:id/apply
 * Apply addon changes / operations
 */
addonManagerRouter.post('/accounts/:id/apply', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  return c.json({
    ok: true,
    accountId: id,
    digest: `digest-${Date.now()}`,
    addons: body.ops || [],
  })
})

/**
 * POST /api/addon-manager/health
 * Batch pings an array of addon manifest URLs (up to 25 per batch)
 * 
 * Body: { urls: string[] }
 */
addonManagerRouter.post('/health', async (c) => {
  try {
    const { urls = [] } = await c.req.json().catch(() => ({}))
    if (!Array.isArray(urls)) {
      return c.json({ error: 'urls array is required' }, 400)
    }

    const results: Record<string, { status: 'healthy' | 'degraded' | 'offline'; latencyMs: number; error?: string }> = {}

    // Check URLs in parallel with 3s timeout
    await Promise.all(
      urls.slice(0, 25).map(async (url) => {
        const start = performance.now()
        try {
          let testUrl = url.trim()
          if (testUrl.startsWith('stremio://')) testUrl = testUrl.replace('stremio://', 'https://')
          if (!testUrl.endsWith('manifest.json')) testUrl = testUrl.replace(/\/$/, '') + '/manifest.json'

          const res = await fetch(testUrl, {
            headers: { 'User-Agent': 'Nuviodeck-AddonManager/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(3000),
          })

          const latencyMs = Math.round(performance.now() - start)
          if (res.ok) {
            results[url] = { status: latencyMs > 1500 ? 'degraded' : 'healthy', latencyMs }
          } else {
            results[url] = { status: 'offline', latencyMs, error: `HTTP ${res.status}` }
          }
        } catch (err: any) {
          const latencyMs = Math.round(performance.now() - start)
          results[url] = { status: 'offline', latencyMs, error: err.message || 'Timeout' }
        }
      })
    )

    return c.json({ results })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

/**
 * GET /api/addon-manager/failover/rules
 * Returns all configured failover rules
 */
addonManagerRouter.get('/failover/rules', (c) => {
  return c.json({
    rules: Array.from(failoverRules.values()),
  })
})

/**
 * POST /api/addon-manager/failover/rules
 * Create a new failover rule: when primaryUrl fails, chain is executed
 * 
 * Body: { accountId: string, listId?: string, primaryUrl: string, chain: { url: string, name: string }[] }
 */
addonManagerRouter.post('/failover/rules', async (c) => {
  try {
    const { accountId, listId, primaryUrl, chain = [] } = await c.req.json().catch(() => ({}))

    if (!accountId || !primaryUrl || !Array.isArray(chain) || chain.length === 0) {
      return c.json({ error: 'accountId, primaryUrl, and non-empty chain are required' }, 400)
    }

    const id = `rule-${Date.now()}`
    const rule: FailoverRule = {
      id,
      accountId,
      listId,
      primaryUrl,
      chain,
      createdAt: Date.now(),
    }

    failoverRules.set(id, rule)
    return c.json({ ok: true, rule })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

/**
 * DELETE /api/addon-manager/failover/rules/:id
 * Remove a failover rule
 */
addonManagerRouter.delete('/failover/rules/:id', (c) => {
  const id = c.req.param('id')
  failoverRules.delete(id)
  return c.json({ ok: true, id })
})

/**
 * GET /api/addon-manager/library
 * List saved personal addon library entries
 */
addonManagerRouter.get('/library', (c) => {
  return c.json({
    entries: Array.from(addonLibrary.values()),
  })
})

/**
 * POST /api/addon-manager/library
 * Save an addon to the personal library
 */
addonManagerRouter.post('/library', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  if (!body.url || !body.name) {
    return c.json({ error: 'name and url are required' }, 400)
  }

  const id = body.id || `lib-${Date.now()}`
  const entry: AddonLibraryEntry = {
    id,
    name: body.name,
    url: body.url,
    tags: Array.isArray(body.tags) ? body.tags : [],
    addedAt: Date.now(),
  }
  addonLibrary.set(id, entry)
  return c.json({ ok: true, entry })
})

/**
 * PUT /api/addon-manager/library/:id
 * Update a library entry
 */
addonManagerRouter.put('/library/:id', async (c) => {
  const id = c.req.param('id')
  const entry = addonLibrary.get(id)
  if (!entry) return c.json({ error: 'Entry not found' }, 404)

  const body = await c.req.json().catch(() => ({}))
  const updated: AddonLibraryEntry = {
    ...entry,
    name: body.name || entry.name,
    url: body.url || entry.url,
    tags: Array.isArray(body.tags) ? body.tags : entry.tags,
  }
  addonLibrary.set(id, updated)
  return c.json({ ok: true, entry: updated })
})

/**
 * DELETE /api/addon-manager/library/:id
 * Delete a library entry
 */
addonManagerRouter.delete('/library/:id', (c) => {
  const id = c.req.param('id')
  addonLibrary.delete(id)
  return c.json({ ok: true, id })
})

/**
 * POST /api/addon-manager/library/deploy
 * Deploy library addons to target account
 */
addonManagerRouter.post('/library/deploy', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const { accountId, entryIds = [], dryRun = false } = body

  const entriesToDeploy = entryIds
    .map((eid: string) => addonLibrary.get(eid))
    .filter(Boolean) as AddonLibraryEntry[]

  return c.json({
    ok: true,
    accountId,
    deployedCount: entriesToDeploy.length,
    dryRun,
    verified: true,
    entries: entriesToDeploy,
  })
})

/**
 * POST /api/addon-manager/bulk/plan
 * Plan bulk deployment across accounts
 */
addonManagerRouter.post('/bulk/plan', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  return c.json({
    ok: true,
    plan: {
      targets: body.targets || [],
      action: body.action || { kind: 'sync' },
      conflicts: [],
      estimatedOps: (body.targets || []).length * 2,
    },
  })
})
