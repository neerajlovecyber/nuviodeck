import { Hono } from 'hono'
import https from 'node:https'
import http from 'node:http'
import dns from 'node:dns/promises'

export const verifyRouter = new Hono()

// Public DNS resolver to bypass local ISP DNS poisoning / sinkholes (e.g. for TMDB/Fanart)
const publicResolver = new dns.Resolver()
publicResolver.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4', '9.9.9.9'])

interface ServiceRequestOptions {
  method?: string
  headers?: Record<string, string>
  body?: string
  timeout?: number
  proxyUrl?: string
}

interface ServiceResponse {
  statusCode: number
  ok: boolean
  data: any
}

/**
 * Universal HTTP/HTTPS request handler matching aiometadata serviceRequest.
 * Includes direct IP resolution via public DNS (Cloudflare/Google) to prevent ISP sinkhole connection timeouts.
 */
async function serviceRequest(
  urlStr: string,
  options: ServiceRequestOptions = {},
  retries = 1
): Promise<ServiceResponse> {
  const targetUrl = options.proxyUrl ? options.proxyUrl.replace(/\/+$/, '') : urlStr
  const url = new URL(targetUrl)
  const isHttps = url.protocol === 'https:'
  const lib = isHttps ? https : http
  const timeout = options.timeout || 6000

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Resolve host IP with public DNS to ensure we bypass any ISP DNS hijack/sinkholes
      let targetHost = url.hostname
      if (!options.proxyUrl && (url.hostname.includes('themoviedb.org') || url.hostname.includes('fanart.tv'))) {
        const addresses = await publicResolver.resolve4(url.hostname).catch(() => [])
        if (addresses && addresses.length > 0) {
          targetHost = addresses[0]
        }
      }

      const response = await new Promise<ServiceResponse>((resolve, reject) => {
        const req = lib.request(
          {
            host: targetHost,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            method: options.method || 'GET',
            headers: {
              Host: url.hostname,
              'User-Agent': 'AIOMetadata/1.0.0 (NuvioDeck Integration)',
              Accept: 'application/json',
              ...options.headers,
            },
            servername: url.hostname, // TLS SNI
            timeout,
          },
          (res) => {
            let bodyText = ''
            res.on('data', (chunk) => (bodyText += chunk))
            res.on('end', () => {
              let bodyJson: any = null
              try {
                bodyJson = JSON.parse(bodyText)
              } catch {
                bodyJson = bodyText
              }
              const statusCode = res.statusCode || 500
              resolve({
                statusCode,
                ok: statusCode >= 200 && statusCode < 300,
                data: bodyJson,
              })
            })
          }
        )

        req.on('timeout', () => {
          req.destroy(new Error('Validation timed out'))
        })
        req.on('error', (err) => reject(err))
        if (options.body) req.write(options.body)
        req.end()
      })

      return response
    } catch (err: any) {
      if (attempt >= retries) {
        throw err
      }
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  }

  throw new Error('Request failed')
}

export type KeyValidationResult = {
  ok: boolean
  status: 'valid' | 'invalid' | 'timeout' | 'error'
  reason?: string
  message?: string
  error?: string
  details?: any
}

/**
 * Validates individual provider API keys 1:1 matching aiometadata testFunctions.
 */
export async function validateSingleKey(
  service: string,
  key: string,
  options?: { proxyUrl?: string }
): Promise<KeyValidationResult> {
  const cleanKey = (key || '').trim()
  if (!cleanKey) {
    return {
      ok: false,
      status: 'invalid',
      error: 'Key cannot be empty',
      message: 'Enter a key first.',
    }
  }

  const normalizedService = service.toLowerCase()

  try {
    switch (normalizedService) {
      // 1. MDBList
      case 'mdblist': {
        const url = `https://api.mdblist.com/user?apikey=${encodeURIComponent(cleanKey)}`
        const res = await serviceRequest(url, { proxyUrl: options?.proxyUrl, timeout: 5000 })

        if (!res.ok) {
          const message = res.data?.error || `MDBList rejected API key (HTTP ${res.statusCode})`
          return { ok: false, status: 'invalid', error: message, message }
        }

        const remainingRaw = res.data?.rate_limit_remaining
        const remaining =
          typeof remainingRaw === 'number' || typeof remainingRaw === 'string'
            ? Number(remainingRaw)
            : NaN

        if (!Number.isNaN(remaining) && remaining <= 0) {
          return {
            ok: false,
            status: 'invalid',
            reason: 'quota_exhausted',
            error: 'MDBList API quota exhausted (rate_limit_remaining=0)',
            message: 'That key is valid but its quota is used up.',
          }
        }

        return {
          ok: true,
          status: 'valid',
          details: {
            user: res.data?.user || res.data?.username || 'MDBList User',
            limits: res.data?.limits || remaining,
          },
        }
      }

      // 2. TMDB
      case 'tmdb': {
        const isBearer = cleanKey.startsWith('eyJ') || cleanKey.length > 50
        const baseUrl = options?.proxyUrl
          ? options.proxyUrl.replace(/\/+$/, '')
          : 'https://api.themoviedb.org/3'

        const url = isBearer
          ? `${baseUrl}/authentication`
          : `${baseUrl}/configuration?api_key=${encodeURIComponent(cleanKey)}`

        const headers: Record<string, string> = isBearer
          ? { Authorization: `Bearer ${cleanKey}` }
          : {}

        const res = await serviceRequest(url, { headers, timeout: 6000 })

        if (!res.ok) {
          const message =
            res.data?.status_message ||
            (res.statusCode === 401 ? 'Invalid TMDB key or token.' : `TMDB rejected key (HTTP ${res.statusCode})`)
          return { ok: false, status: 'invalid', error: message, message }
        }

        return { ok: true, status: 'valid', details: { service: 'tmdb' } }
      }

      // 3. Gemini
      case 'gemini': {
        const url = `https://generativelanguage.googleapis.com/v1beta/models`
        const res = await serviceRequest(url, {
          headers: {
            'x-goog-api-key': cleanKey,
            'Content-Type': 'application/json',
          },
          timeout: 6000,
        })

        if (!res.ok) {
          const message = res.data?.error?.message || `Google Gemini rejected key (HTTP ${res.statusCode})`
          return { ok: false, status: 'invalid', error: message, message }
        }

        const models: string[] = (res.data?.models || []).map((m: any) =>
          m.name?.replace('models/', '')
        )

        let activeModel = 'gemini-3.5-flash-lite'
        let warning: string | undefined

        if (models.includes('gemini-3.5-flash-lite')) {
          activeModel = 'gemini-3.5-flash-lite'
        } else if (models.includes('gemini-3.1-flash-lite')) {
          activeModel = 'gemini-3.1-flash-lite'
          warning = 'Gemini 3.5 Flash-Lite is not active on this key. Falling back to Gemini 3.1 Flash-Lite.'
        } else if (models.includes('gemini-2.5-flash')) {
          activeModel = 'gemini-2.5-flash'
        }

        return {
          ok: true,
          status: 'valid',
          details: { provider: 'gemini', activeModel, warning },
        }
      }

      // 4. Groq
      case 'groq': {
        const url = 'https://api.groq.com/openai/v1/models'
        const res = await serviceRequest(url, {
          headers: { Authorization: `Bearer ${cleanKey}` },
          timeout: 6000,
        })

        if (!res.ok) {
          const message = res.data?.error?.message || `Groq rejected key (HTTP ${res.statusCode})`
          return { ok: false, status: 'invalid', error: message, message }
        }

        return {
          ok: true,
          status: 'valid',
          details: { provider: 'groq', activeModel: 'openai/gpt-oss-120b' },
        }
      }

      // 5. DeepSeek
      case 'deepseek': {
        const url = 'https://api.deepseek.com/models'
        const res = await serviceRequest(url, {
          headers: { Authorization: `Bearer ${cleanKey}` },
          timeout: 6000,
        })

        if (!res.ok) {
          const message = res.data?.error?.message || `DeepSeek rejected key (HTTP ${res.statusCode})`
          return { ok: false, status: 'invalid', error: message, message }
        }

        return {
          ok: true,
          status: 'valid',
          details: { provider: 'deepseek', activeModel: 'deepseek-v4-flash' },
        }
      }

      // 6. Letterboxd
      case 'letterboxd': {
        const username = cleanKey.replace(/^@/, '')
        const url = `https://letterboxd.com/${encodeURIComponent(username)}/rss/`
        const res = await serviceRequest(url, { timeout: 6000 })

        if (res.statusCode === 404) {
          const message = `Letterboxd user "${username}" was not found.`
          return { ok: false, status: 'invalid', error: message, message }
        }

        if (!res.ok && res.statusCode !== 301 && res.statusCode !== 302) {
          const message = `Could not verify Letterboxd username (HTTP ${res.statusCode})`
          return { ok: false, status: 'invalid', error: message, message }
        }

        return { ok: true, status: 'valid', details: { service: 'letterboxd', username } }
      }

      // 7. RPDB
      case 'rpdb': {
        const url = `https://api.ratingposterdb.com/${encodeURIComponent(cleanKey)}/isValid`
        const res = await serviceRequest(url, { timeout: 6000 })

        if (!res.ok) {
          const message = `RPDB token invalid (HTTP ${res.statusCode})`
          return { ok: false, status: 'invalid', error: message, message }
        }

        const isValid = res.data?.valid === true
        return {
          ok: isValid,
          status: isValid ? 'valid' : 'invalid',
          error: isValid ? undefined : 'RPDB token reported invalid',
          message: isValid ? 'Key accepted.' : 'RPDB token reported invalid',
        }
      }

      // 8. Fanart
      case 'fanart': {
        const url = `https://webservice.fanart.tv/v3/movies/603?api_key=${encodeURIComponent(cleanKey)}`
        const res = await serviceRequest(url, { timeout: 6000 })

        if (!res.ok) {
          const message = `Fanart.tv key invalid (HTTP ${res.statusCode})`
          return { ok: false, status: 'invalid', error: message, message }
        }

        return { ok: true, status: 'valid', details: { service: 'fanart' } }
      }

      // 9. TVDB
      case 'tvdb': {
        const url = 'https://api4.thetvdb.com/v4/login'
        const res = await serviceRequest(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apikey: cleanKey }),
          timeout: 6000,
        })

        const isValid = res.ok && !!res.data?.data?.token
        return {
          ok: isValid,
          status: isValid ? 'valid' : 'invalid',
          message: isValid ? 'Key accepted.' : 'TVDB rejected API key',
        }
      }

      // 10. Top-Posters
      case 'topposter': {
        const url = `https://api.top-posters.com/auth/verify/${encodeURIComponent(cleanKey)}`
        const res = await serviceRequest(url, { timeout: 6000 })
        const isValid = res.ok && res.data?.valid === true && res.data?.is_active === true
        return {
          ok: isValid,
          status: isValid ? 'valid' : 'invalid',
          message: isValid ? 'Key accepted.' : 'Top-Posters token invalid',
        }
      }

      // 11. OpenRouter
      case 'openrouter': {
        const url = 'https://openrouter.ai/api/v1/auth/key'
        const res = await serviceRequest(url, {
          headers: { Authorization: `Bearer ${cleanKey}` },
          timeout: 6000,
        })
        const isValid = res.statusCode === 200
        return {
          ok: isValid,
          status: isValid ? 'valid' : 'invalid',
          message: isValid ? 'Key accepted.' : 'OpenRouter rejected key',
        }
      }

      // 12. AniList (Token or Username)
      case 'anilist': {
        if (cleanKey.length > 40 || cleanKey.startsWith('eyJ')) {
          const q = `query { Viewer { id name avatar { medium large } } }`
          const res = await serviceRequest('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${cleanKey}`,
            },
            body: JSON.stringify({ query: q }),
            timeout: 6000,
          })
          if (res.ok && res.data?.data?.Viewer?.name) {
            const viewer = res.data.data.Viewer
            return {
              ok: true,
              status: 'valid',
              details: {
                username: viewer.name,
                userId: viewer.id,
                avatarUrl: viewer.avatar?.medium || viewer.avatar?.large,
              },
            }
          }
        }

        const q = `query ($name: String) { User(name: $name) { id name avatar { medium large } statistics { anime { count episodesWatched } } } }`
        const res = await serviceRequest('https://graphql.anilist.co', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ query: q, variables: { name: cleanKey } }),
          timeout: 6000,
        })

        if (res.ok && res.data?.data?.User?.name) {
          const user = res.data.data.User
          return {
            ok: true,
            status: 'valid',
            details: {
              username: user.name,
              userId: user.id,
              avatarUrl: user.avatar?.medium || user.avatar?.large,
              animeCount: user.statistics?.anime?.count,
            },
          }
        }

        return {
          ok: false,
          status: 'invalid',
          error: 'AniList user or token not found',
          message: 'AniList username or token not found',
        }
      }

      // 13. MyAnimeList (Token or Username)
      case 'myanimelist':
      case 'mal': {
        if (cleanKey.length > 40) {
          const res = await serviceRequest('https://api.myanimelist.net/v2/users/@me', {
            headers: { Authorization: `Bearer ${cleanKey}` },
            timeout: 6000,
          })
          if (res.ok && res.data?.name) {
            return {
              ok: true,
              status: 'valid',
              details: {
                username: res.data.name,
                avatarUrl: res.data.picture,
              },
            }
          }
        }

        const res = await serviceRequest(`https://api.jikan.moe/v4/users/${encodeURIComponent(cleanKey)}`, {
          timeout: 6000,
        })

        if (res.ok && res.data?.data?.username) {
          const u = res.data.data
          return {
            ok: true,
            status: 'valid',
            details: {
              username: u.username,
              avatarUrl: u.images?.jpg?.image_url,
            },
          }
        }

        return {
          ok: false,
          status: 'invalid',
          error: 'MyAnimeList user not found',
          message: 'MyAnimeList user not found',
        }
      }

      // 12. Debrid providers
      case 'realdebrid':
      case 'real-debrid':
      case 'rd': {
        const url = 'https://api.real-debrid.com/rest/1.0/user'
        const res = await serviceRequest(url, {
          headers: { Authorization: `Bearer ${cleanKey}` },
          timeout: 6000,
        })

        if (!res.ok) {
          const message = `Real-Debrid rejected token (HTTP ${res.statusCode})`
          return { ok: false, status: 'invalid', error: message, message }
        }

        return {
          ok: true,
          status: 'valid',
          details: {
            username: res.data?.username,
            premium: res.data?.type === 'premium',
            expiration: res.data?.expiration,
          },
        }
      }

      case 'alldebrid':
      case 'ad': {
        const url = `https://api.alldebrid.com/v4/user?agent=nuviodeck&apikey=${encodeURIComponent(cleanKey)}`
        const res = await serviceRequest(url, { timeout: 6000 })

        if (!res.ok || res.data?.status !== 'success') {
          const message = res.data?.error?.message || `AllDebrid rejected key (HTTP ${res.statusCode})`
          return { ok: false, status: 'invalid', error: message, message }
        }

        return {
          ok: true,
          status: 'valid',
          details: {
            username: res.data?.data?.user?.username,
            isPremium: res.data?.data?.user?.isPremium,
          },
        }
      }

      case 'premiumize':
      case 'pm': {
        const url = `https://www.premiumize.me/api/account/info?apikey=${encodeURIComponent(cleanKey)}`
        const res = await serviceRequest(url, { timeout: 6000 })

        if (!res.ok || res.data?.status !== 'success') {
          const message = res.data?.message || `Premiumize rejected key (HTTP ${res.statusCode})`
          return { ok: false, status: 'invalid', error: message, message }
        }

        return {
          ok: true,
          status: 'valid',
          details: { premiumUntil: res.data?.premium_until },
        }
      }

      case 'torbox':
      case 'tb': {
        const url = 'https://api.torbox.app/v1/api/user/me'
        const res = await serviceRequest(url, {
          headers: { Authorization: `Bearer ${cleanKey}` },
          timeout: 6000,
        })

        if (!res.ok) {
          const message = res.data?.detail || `TorBox rejected token (HTTP ${res.statusCode})`
          return { ok: false, status: 'invalid', error: message, message }
        }

        return {
          ok: true,
          status: 'valid',
          details: { email: res.data?.data?.email, plan: res.data?.data?.plan },
        }
      }

      case 'debridlink':
      case 'dl': {
        const url = 'https://debrid-link.com/api/v2/account/infos'
        const res = await serviceRequest(url, {
          headers: { Authorization: `Bearer ${cleanKey}` },
          timeout: 6000,
        })

        if (!res.ok || res.data?.success !== true) {
          const message = res.data?.error || `Debrid-Link rejected key (HTTP ${res.statusCode})`
          return { ok: false, status: 'invalid', error: message, message }
        }

        return {
          ok: true,
          status: 'valid',
          details: { username: res.data?.value?.username },
        }
      }

      default: {
        if (cleanKey.length >= 4) {
          return { ok: true, status: 'valid', details: { service, note: 'Format accepted' } }
        }
        return {
          ok: false,
          status: 'invalid',
          error: `Invalid ${service} token format`,
          message: 'Format rejected.',
        }
      }
    }
  } catch (err: any) {
    const isTimeout =
      err.message?.includes('timed out') ||
      err.name === 'TimeoutError' ||
      err.code === 'ETIMEDOUT' ||
      err.code === 'ABORT_ERR'

    if (isTimeout) {
      return {
        ok: false,
        status: 'timeout',
        error: 'Validation timed out. Try again.',
        message: 'Validation timed out. Try again.',
      }
    }

    const message = err.message || 'Verification request failed'
    return { ok: false, status: 'error', error: message, message }
  }
}

/**
 * POST /api/test-keys
 * 1:1 compatibility with aiometadata test-keys endpoint.
 */
verifyRouter.post('/test-keys', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const apiKeys = body.apiKeys || {}
  const globalProxyUrl = body.proxyUrl

  const details: Record<
    string,
    { status: 'valid' | 'invalid' | 'timeout' | 'error'; reason?: string; message?: string; details?: any }
  > = {}

  await Promise.all(
    Object.entries(apiKeys).map(async ([keyId, value]) => {
      if (typeof value === 'string' && value.trim()) {
        const proxyUrl = body.options?.[keyId]?.proxyUrl || globalProxyUrl
        const res = await validateSingleKey(keyId, value.trim(), { proxyUrl })
        details[keyId] = {
          status: res.status,
          reason: res.reason,
          message: res.message || res.error,
          details: res.details,
        }
      }
    })
  )

  return c.json({ success: true, details })
})

/**
 * POST /api/verify/:service
 * Verifies external service API keys and configuration tokens individually.
 */
verifyRouter.post('/:service', async (c) => {
  const service = c.req.param('service').toLowerCase()
  const body = await c.req.json().catch(() => ({}))
  const key = (body.key || body.apiKey || body.token || '').trim()

  const result = await validateSingleKey(service, key, { proxyUrl: body.proxyUrl })
  if (!result.ok) {
    return c.json(
      {
        ok: false,
        error: result.error || result.message,
        message: result.message || result.error,
        status: result.status,
        reason: result.reason,
      },
      400
    )
  }

  return c.json({ ok: true, status: result.status, ...result.details })
})
