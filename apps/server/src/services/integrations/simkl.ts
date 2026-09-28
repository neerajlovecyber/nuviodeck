import crypto from 'node:crypto'

export interface SimklPinResponse {
  device_code: string
  user_code: string
  verification_url: string
  expires_in: number
  interval: number
}

export function generateSimklPKCE() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url')
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')
  return { codeVerifier, codeChallenge }
}

export interface SimklScrobblePayload {
  movie?: {
    title?: string
    year?: number
    ids: {
      simkl?: number
      tmdb?: number
      imdb?: string
    }
  }
  show?: {
    title?: string
    year?: number
    ids: {
      simkl?: number
      tmdb?: number
      imdb?: string
    }
  }
  episode?: {
    season: number
    number: number
    title?: string
    ids?: {
      simkl?: number
      tmdb?: number
      imdb?: string
    }
  }
  progress?: number // 0 to 100
}

export class SimklService {
  private get clientId(): string {
    return (
      process.env.SIMKL_CLIENT_ID ||
      '33d3d3f2b7722437aca22696229fc995ab70f82476cfb978d98e68e55f38e316'
    )
  }

  private get clientSecret(): string {
    return (
      process.env.SIMKL_CLIENT_SECRET ||
      'simkl_cs_M7vh523tkfO8TAw5xrGF4oJpj9LL0mw8CY'
    )
  }
  private baseUrl = 'https://api.simkl.com'

  constructor(clientId?: string) {
    if (clientId) process.env.SIMKL_CLIENT_ID = clientId
  }

  private headers(accessToken?: string): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'NuvioDeck/1.0',
      'simkl-api-key': this.clientId,
    }
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }
    return headers
  }

  getAuthUrl(redirectUri: string, codeChallenge?: string, state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
    })
    if (codeChallenge) {
      params.set('code_challenge', codeChallenge)
      params.set('code_challenge_method', 'S256')
    }
    if (state) params.set('state', state)
    return `https://simkl.com/oauth2/authorize?${params.toString()}`
  }

  async exchangeAuthCode(
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<{ access_token: string }> {
    const candidateUris = [
      redirectUri,
      'http://localhost:3000/api/integrations/simkl/callback',
      'http://localhost:3001/api/integrations/simkl/callback',
      'https://simkl.com',
    ].filter((uri, idx, arr) => uri && arr.indexOf(uri) === idx)

    let lastError = ''
    for (const uri of candidateUris) {
      try {
        const bodyPayload: Record<string, any> = {
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: uri,
          grant_type: 'authorization_code',
        }
        if (codeVerifier) {
          bodyPayload.code_verifier = codeVerifier
        }

        const res = await fetch(`${this.baseUrl}/oauth2/token`, {
          method: 'POST',
          headers: this.headers(),
          body: JSON.stringify(bodyPayload),
          signal: AbortSignal.timeout(6000),
        })

        if (res.ok) {
          return await res.json()
        }
        const errText = await res.text().catch(() => '')
        lastError = `(${res.status}): ${errText}`
      } catch (err: any) {
        lastError = err.message
      }
    }

    throw new Error(`Simkl authorization code exchange failed ${lastError}`)
  }

  /**
   * 1. Get Device code / PIN code for user authentication at simkl.com/pin
   */
  async getPinCode(): Promise<SimklPinResponse> {
    const res = await fetch(`${this.baseUrl}/oauth2/device`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        client_id: this.clientId,
      }),
      signal: AbortSignal.timeout(6000),
    })

    if (!res.ok) {
      throw new Error(`Failed to generate Simkl device code (${res.status})`)
    }
    const data = await res.json()
    return {
      device_code: data.device_code,
      user_code: data.user_code,
      verification_url:
        data.verification_uri_complete ||
        (data.verification_uri ? `${data.verification_uri}?user_code=${data.user_code}` : `https://simkl.com/pin?user_code=${data.user_code}`),
      expires_in: data.expires_in || 900,
      interval: data.interval || 5,
    }
  }

  /**
   * 2. Poll/exchange device_code for access token
   */
  async exchangePin(deviceCode: string): Promise<{ access_token?: string; error?: string; error_description?: string; pending?: boolean }> {
    const res = await fetch(`${this.baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
      signal: AbortSignal.timeout(6000),
    })

    const data = await res.json()
    if (data.error === 'authorization_pending' || data.error === 'slow_down') {
      return { pending: true, error: data.error, error_description: data.error_description }
    }
    return data
  }

  /**
   * Fetch current Simkl user profile
   */
  async getUserSettings(accessToken: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/users/settings`, {
      headers: this.headers(accessToken),
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) {
      throw new Error(`Failed to fetch Simkl settings (${res.status})`)
    }
    return res.json()
  }

  /**
   * Fetch user list items (movies, tv, anime)
   * status: 'watching' | 'plantowatch' | 'hold' | 'completed' | 'dropped'
   */
  async getListItems(accessToken: string, type: 'movies' | 'tv' | 'anime' = 'movies', status = 'plantowatch'): Promise<any[]> {
    const res = await fetch(`${this.baseUrl}/sync/all-items/${type}/${status}`, {
      headers: this.headers(accessToken),
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return []
    const data = (await res.json()) as any
    return data[type] || data || []
  }

  /**
   * Log playback to history (movies, shows, or episodes)
   */
  async addToHistory(
    accessToken: string,
    payload: {
      movies?: Array<{ title?: string; ids: { simkl?: number; tmdb?: number; imdb?: string } }>
      shows?: Array<{ title?: string; ids: { simkl?: number; tmdb?: number; imdb?: string } }>
      episodes?: Array<{ season: number; number: number; ids?: { simkl?: number; tmdb?: number; imdb?: string } }>
    }
  ): Promise<any> {
    const res = await fetch(`${this.baseUrl}/sync/history`, {
      method: 'POST',
      headers: this.headers(accessToken),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    })
    return res.json().catch(() => ({}))
  }

  /**
   * Simkl Scrobble: Playback Started
   */
  async scrobbleStart(accessToken: string, payload: SimklScrobblePayload): Promise<any> {
    const res = await fetch(`${this.baseUrl}/sync/playback/start`, {
      method: 'POST',
      headers: this.headers(accessToken),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    })
    return res.json().catch(() => ({}))
  }

  /**
   * Simkl Scrobble: Playback Paused
   */
  async scrobblePause(accessToken: string, payload: SimklScrobblePayload): Promise<any> {
    const res = await fetch(`${this.baseUrl}/sync/playback/pause`, {
      method: 'POST',
      headers: this.headers(accessToken),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    })
    return res.json().catch(() => ({}))
  }

  /**
   * Simkl Scrobble: Playback Stopped / Completed
   */
  async scrobbleStop(accessToken: string, payload: SimklScrobblePayload): Promise<any> {
    const res = await fetch(`${this.baseUrl}/sync/playback/stop`, {
      method: 'POST',
      headers: this.headers(accessToken),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    })
    return res.json().catch(() => ({}))
  }
}

export const simklService = new SimklService()
