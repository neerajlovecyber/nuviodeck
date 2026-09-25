import { Hono } from 'hono'

export const verifyRouter = new Hono()

/**
 * POST /api/verify/:service
 * Verifies external service API keys and configuration tokens.
 * Matches exact Xperience signatures.
 */
verifyRouter.post('/:service', async (c) => {
  const service = c.req.param('service').toLowerCase()
  const body = await c.req.json().catch(() => ({}))
  const key = (body.key || body.apiKey || body.token || '').trim()

  if (!key) {
    return c.json({ ok: false, error: 'Key cannot be empty' }, 400)
  }

  try {
    switch (service) {
      case 'gemini': {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`
        const res = await fetch(url)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          return c.json({
            ok: false,
            error: err.error?.message || `Google Gemini rejected key (HTTP ${res.status})`,
          })
        }
        const data = await res.json().catch(() => ({}))
        const models: string[] = (data.models || []).map((m: any) => m.name?.replace('models/', ''))

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

        return c.json({
          ok: true,
          provider: 'gemini',
          activeModel,
          warning,
        })
      }

      case 'groq': {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        })
        if (!res.ok) {
          return c.json({ ok: false, error: `Groq rejected key (HTTP ${res.status})` })
        }
        return c.json({ ok: true, provider: 'groq', activeModel: 'openai/gpt-oss-120b' })
      }

      case 'deepseek': {
        const res = await fetch('https://api.deepseek.com/models', {
          headers: { Authorization: `Bearer ${key}` },
        })
        if (!res.ok) {
          return c.json({ ok: false, error: `DeepSeek rejected key (HTTP ${res.status})` })
        }
        return c.json({ ok: true, provider: 'deepseek', activeModel: 'deepseek-v4-flash' })
      }

      case 'tmdb': {
        // Try Bearer token first, then fallback to api_key param
        let res = await fetch('https://api.themoviedb.org/3/authentication', {
          headers: { Authorization: `Bearer ${key}` },
        })
        if (!res.ok) {
          res = await fetch(`https://api.themoviedb.org/3/configuration?api_key=${encodeURIComponent(key)}`)
        }
        if (!res.ok) {
          return c.json({ ok: false, error: `TMDB authentication failed (HTTP ${res.status})` })
        }
        return c.json({ ok: true, service: 'tmdb' })
      }

      case 'rpdb': {
        const res = await fetch(`https://api.ratingposterdb.com/${encodeURIComponent(key)}/isValid`)
        if (!res.ok) {
          return c.json({ ok: false, error: `RPDB token invalid (HTTP ${res.status})` })
        }
        const data = await res.json().catch(() => ({}))
        return c.json({ ok: data.valid !== false, service: 'rpdb' })
      }

      case 'realdebrid': {
        const res = await fetch('https://api.real-debrid.com/rest/1.0/user', {
          headers: { Authorization: `Bearer ${key}` },
        })
        if (!res.ok) {
          return c.json({ ok: false, error: `Real-Debrid rejected token (HTTP ${res.status})` })
        }
        const data = await res.json().catch(() => ({}))
        return c.json({
          ok: true,
          username: data.username,
          premium: data.type === 'premium',
          expiration: data.expiration,
        })
      }

      case 'torbox': {
        const res = await fetch('https://api.torbox.app/v1/api/user/me', {
          headers: { Authorization: `Bearer ${key}` },
        })
        if (!res.ok) {
          return c.json({ ok: false, error: `TorBox rejected token (HTTP ${res.status})` })
        }
        const data = await res.json().catch(() => ({}))
        return c.json({
          ok: true,
          email: data.data?.email,
          plan: data.data?.plan,
        })
      }

      case 'alldebrid': {
        const res = await fetch(`https://api.alldebrid.com/v4/user?agent=nuviodeck&apikey=${encodeURIComponent(key)}`)
        if (!res.ok) {
          return c.json({ ok: false, error: `AllDebrid rejected key (HTTP ${res.status})` })
        }
        const data = await res.json().catch(() => ({}))
        return c.json({
          ok: data.status === 'success',
          username: data.data?.user?.username,
          isPremium: data.data?.user?.isPremium,
        })
      }

      case 'premiumize': {
        const res = await fetch(`https://www.premiumize.me/api/account/info?apikey=${encodeURIComponent(key)}`)
        if (!res.ok) {
          return c.json({ ok: false, error: `Premiumize rejected key (HTTP ${res.status})` })
        }
        const data = await res.json().catch(() => ({}))
        return c.json({
          ok: data.status === 'success',
          premiumUntil: data.premium_until,
        })
      }

      case 'debridlink': {
        const res = await fetch('https://debrid-link.com/api/v2/account/infos', {
          headers: { Authorization: `Bearer ${key}` },
        })
        if (!res.ok) {
          return c.json({ ok: false, error: `Debrid-Link rejected key (HTTP ${res.status})` })
        }
        const data = await res.json().catch(() => ({}))
        return c.json({
          ok: data.success === true,
          username: data.value?.username,
        })
      }

      case 'fanart': {
        const res = await fetch(`https://webservice.fanart.tv/v3/movies/10195?api_key=${encodeURIComponent(key)}`)
        if (!res.ok) {
          return c.json({ ok: false, error: `Fanart.tv key invalid (HTTP ${res.status})` })
        }
        return c.json({ ok: true, service: 'fanart' })
      }

      // Poster and rating providers with token format verification
      case 'easy_ratings':
      case 'better_posters':
      case 'top_posters':
      case 'xrdb':
      case 'posters_plus':
      case 'custom_url':
      case 'letterboxd': {
        if (key.length >= 4) {
          return c.json({ ok: true, service })
        }
        return c.json({ ok: false, error: `Invalid ${service} token format` })
      }

      default:
        // Generic success for arbitrary services
        return c.json({ ok: true, service, note: 'Format acknowledged' })
    }
  } catch (err: any) {
    return c.json({ ok: false, error: err.message || 'Verification request failed' }, 500)
  }
})
