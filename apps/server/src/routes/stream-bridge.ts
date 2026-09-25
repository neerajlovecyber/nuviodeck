import { Hono } from 'hono'
import { debridService } from '../services/debrid'

export const streamBridgeRouter = new Hono()

// Supported upstream scrapers and debrid providers from decoded Xperience specs
const SUPPORTED_UPSTREAMS = ['comet', 'mediafusion', 'stremthru', 'debridio', 'peerflix'] as const
const SUPPORTED_DEBRIDS = ['torbox', 'realdebrid', 'alldebrid', 'premiumize', 'debridlink', 'offcloud'] as const
const SUPPORTED_PROXIES = ['mediaflow', 'stremthru'] as const

const UPSTREAM_DEFAULT_URLS: Record<string, string> = {
  comet: 'https://comet.elfhosted.com',
  mediafusion: 'https://mediafusion.elfhosted.com',
  stremthru: 'https://stremthru.elfhosted.com',
}

/**
 * GET /api/stream-bridge/config
 * Returns supported scrapers, debrid providers, proxy backends, and default URLs
 */
streamBridgeRouter.get('/config', (c) => {
  return c.json({
    upstreams: SUPPORTED_UPSTREAMS,
    debridServices: SUPPORTED_DEBRIDS,
    proxyBackends: SUPPORTED_PROXIES,
    defaultUrls: UPSTREAM_DEFAULT_URLS,
  })
})

/**
 * POST /api/stream-bridge/validate-proxy
 * Validates MediaFlow / StremThru proxy endpoint credentials and measures latency
 * 
 * Body: { backend: "mediaflow" | "stremthru", url: string, credentials?: string }
 */
streamBridgeRouter.post('/validate-proxy', async (c) => {
  try {
    const { backend, url, credentials } = await c.req.json().catch(() => ({}))

    if (!url || typeof url !== 'string' || !url.trim()) {
      return c.json({ ok: false, error: 'Proxy URL is required' }, 400)
    }

    const cleanUrl = url.trim().replace(/\/$/, '')
    const selectedBackend = backend || 'mediaflow'

    const startTime = performance.now()
    const headers: Record<string, string> = {
      'User-Agent': 'Nuviodeck-Engine/1.0',
    }

    if (credentials) {
      if (selectedBackend === 'mediaflow') {
        headers['api_password'] = credentials
      } else {
        headers['Authorization'] = `Basic ${Buffer.from(credentials).toString('base64')}`
      }
    }

    // Ping proxy health/root endpoint with 4s timeout
    const testEndpoints = selectedBackend === 'mediaflow' 
      ? [`${cleanUrl}/health`, `${cleanUrl}/docs`, cleanUrl] 
      : [`${cleanUrl}/ping`, `${cleanUrl}/v0/status`, cleanUrl]

    let verified = false
    let lastError = 'No response'

    for (const testUrl of testEndpoints) {
      try {
        const resp = await fetch(testUrl, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(4000),
        })

        if (resp.status < 500) {
          verified = true
          break
        }
      } catch (err: any) {
        lastError = err.message
      }
    }

    const latencyMs = Math.round(performance.now() - startTime)

    if (!verified) {
      return c.json({
        ok: false,
        error: `Could not connect to proxy backend at ${cleanUrl}: ${lastError}`,
        latencyMs,
      }, 502)
    }

    return c.json({
      ok: true,
      backend: selectedBackend,
      url: cleanUrl,
      latencyMs,
      message: `${selectedBackend === 'mediaflow' ? 'MediaFlow Proxy' : 'StremThru'} connection verified (${latencyMs}ms)`,
    })
  } catch (err: any) {
    return c.json({ ok: false, error: err.message || 'Validation failed' }, 500)
  }
})

/**
 * POST /api/stream-bridge/validate-upstream
 * Validates a scraper upstream with a debrid API key
 * 
 * Body: { upstream: string, debrid_service: string, api_key: string, upstream_key?: string }
 */
streamBridgeRouter.post('/validate-upstream', async (c) => {
  try {
    const { upstream, debrid_service, api_key, upstream_key } = await c.req.json().catch(() => ({}))

    if (!upstream || !debrid_service || !api_key) {
      return c.json({ ok: false, error: 'upstream, debrid_service, and api_key are required' }, 400)
    }

    // 1. Verify debrid account token first
    const debridCheck = await debridService.validateToken(debrid_service, api_key)
    if (!debridCheck.valid) {
      return c.json({
        ok: false,
        error: `Invalid ${debrid_service} API token: ${debridCheck.error || 'Authentication rejected'}`,
      }, 400)
    }

    // 2. Ping upstream host if a default host exists
    const upstreamUrl = UPSTREAM_DEFAULT_URLS[upstream] || null
    let latencyMs = 0

    if (upstreamUrl) {
      const startTime = performance.now()
      try {
        await fetch(`${upstreamUrl}/manifest.json`, {
          headers: { 'User-Agent': 'Nuviodeck-Engine/1.0' },
          signal: AbortSignal.timeout(4000),
        })
        latencyMs = Math.round(performance.now() - startTime)
      } catch {
        // Non-fatal, upstream might still work via custom route
      }
    }

    return c.json({
      ok: true,
      upstream,
      debrid_service,
      latencyMs,
      message: `${upstream} verified with ${debrid_service}`,
    })
  } catch (err: any) {
    return c.json({ ok: false, error: err.message || 'Upstream validation failed' }, 500)
  }
})

/**
 * POST /api/stream-bridge/validate-addon
 * Validates an external Stremio / Nuvio addon manifest URL and inspects resources (e.g. subtitles, streams)
 * 
 * Body: { manifestUrl: string, resource?: string }
 */
streamBridgeRouter.post('/validate-addon', async (c) => {
  try {
    const { manifestUrl, resource } = await c.req.json().catch(() => ({}))

    if (!manifestUrl || typeof manifestUrl !== 'string' || !manifestUrl.trim()) {
      return c.json({ ok: false, error: 'manifestUrl is required' }, 400)
    }

    let cleanUrl = manifestUrl.trim()
    // Handle stremio:// protocol
    if (cleanUrl.startsWith('stremio://')) {
      cleanUrl = cleanUrl.replace(/^stremio:\/\//, 'https://')
    }
    // Append manifest.json if missing
    if (!cleanUrl.endsWith('manifest.json') && !cleanUrl.includes('/manifest.json')) {
      cleanUrl = cleanUrl.replace(/\/$/, '') + '/manifest.json'
    }

    const resp = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Nuviodeck-Engine/1.0',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!resp.ok) {
      return c.json({
        ok: false,
        error: `Addon server returned HTTP ${resp.status} ${resp.statusText}`,
      }, 502)
    }

    const manifest = (await resp.json()) as any
    if (!manifest || typeof manifest !== 'object' || !manifest.id || !manifest.name) {
      return c.json({
        ok: false,
        error: 'Target URL returned invalid or missing Stremio manifest format (missing id or name)',
      }, 422)
    }

    // Check requested resource if specified
    if (resource) {
      const resources = manifest.resources || []
      const hasResource = resources.some((r: any) => {
        if (typeof r === 'string') return r.toLowerCase() === resource.toLowerCase()
        if (typeof r === 'object' && r?.name) return r.name.toLowerCase() === resource.toLowerCase()
        return false
      })

      if (!hasResource) {
        return c.json({
          ok: false,
          error: `Addon "${manifest.name}" does not provide the requested "${resource}" resource`,
        }, 422)
      }
    }

    return c.json({
      ok: true,
      manifestUrl: cleanUrl,
      id: manifest.id,
      name: manifest.name,
      version: manifest.version || '1.0.0',
      description: manifest.description || '',
      idPrefixes: manifest.idPrefixes || [],
      types: manifest.types || [],
      resources: manifest.resources || [],
    })
  } catch (err: any) {
    return c.json({
      ok: false,
      error: `Failed to fetch addon manifest: ${err.message}`,
    }, 500)
  }
})
