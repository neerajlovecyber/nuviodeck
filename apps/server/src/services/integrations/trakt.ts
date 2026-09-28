export interface TraktDeviceCodeResponse {
  device_code: string
  user_code: string
  verification_url: string
  expires_in: number
  interval: number
}

export interface TraktTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  scope: string
  created_at: number
}

export interface ScrobblePayload {
  movie?: {
    title?: string
    year?: number
    ids: {
      tmdb?: number
      imdb?: string
      trakt?: number
    }
  }
  show?: {
    title?: string
    year?: number
    ids: {
      tmdb?: number
      imdb?: string
      trakt?: number
    }
  }
  episode?: {
    season: number
    number: number
    title?: string
    ids?: {
      tmdb?: number
      imdb?: string
      trakt?: number
    }
  }
  progress: number // 0 to 100
  app_version?: string
}

export class TraktService {
  private get clientId(): string {
    return (
      process.env.TRAKT_CLIENT_ID ||
      'd852bb071e62164e9e03dd90d9a6c6c74d6c758650df9de0bf749dfb2ad2b993'
    )
  }

  private get clientSecret(): string {
    return process.env.TRAKT_CLIENT_SECRET || ''
  }

  private baseUrl = 'https://api.trakt.tv'

  constructor(clientId?: string, clientSecret?: string) {
    if (clientId) process.env.TRAKT_CLIENT_ID = clientId
    if (clientSecret) process.env.TRAKT_CLIENT_SECRET = clientSecret
  }

  private headers(accessToken?: string): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'NuvioDeck/1.0',
      'trakt-api-version': '2',
      'trakt-api-key': this.clientId,
    }
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }
    return headers
  }

  getAuthUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
    })
    if (state) params.set('state', state)
    return `https://trakt.tv/oauth/authorize?${params.toString()}`
  }

  async exchangeAuthCode(code: string, redirectUri: string): Promise<TraktTokenResponse> {
    const candidateUris = [
      redirectUri,
      'http://localhost:3000/api/integrations/trakt/callback',
      'http://localhost:3001/api/integrations/trakt/callback',
      'urn:ietf:wg:oauth:2.0:oob',
    ].filter((uri, idx, arr) => uri && arr.indexOf(uri) === idx)

    let lastError = ''
    for (const uri of candidateUris) {
      try {
        const res = await fetch(`${this.baseUrl}/oauth/token`, {
          method: 'POST',
          headers: this.headers(),
          body: JSON.stringify({
            code,
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: uri,
            grant_type: 'authorization_code',
          }),
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

    throw new Error(`Trakt authorization code exchange failed ${lastError}`)
  }

  /**
   * 1. Start Device Code flow (user sees e.g. "ABCD1234" to enter at trakt.tv/activate)
   */
  async getDeviceCode(): Promise<TraktDeviceCodeResponse> {
    const res = await fetch(`${this.baseUrl}/oauth/device/code`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ client_id: this.clientId }),
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      throw new Error(`Failed to generate Trakt device code (${res.status})`)
    }
    return res.json()
  }

  /**
   * 2. Poll / exchange device code for access token
   */
  async exchangeDeviceCode(deviceCode: string): Promise<TraktTokenResponse> {
    const res = await fetch(`${this.baseUrl}/oauth/device/token`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        code: deviceCode,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      throw new Error(`Trakt token exchange pending or failed (${res.status}): ${err}`)
    }
    return res.json()
  }

  /**
   * 3. Refresh expired access token using refresh_token
   */
  async refreshAccessToken(refreshToken: string): Promise<TraktTokenResponse> {
    const res = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
        grant_type: 'refresh_token',
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => '')
      throw new Error(`Trakt token refresh failed (${res.status}): ${err}`)
    }
    return res.json()
  }

  /**
   * Fetch current user profile
   */
  async getUserProfile(accessToken: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/users/me?extended=full`, {
      headers: this.headers(accessToken),
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) {
      throw new Error(`Failed to fetch Trakt profile (${res.status})`)
    }
    return res.json()
  }

  /**
   * Get user Watchlist
   */
  async getWatchlist(accessToken: string, type: 'movies' | 'shows' = 'movies', page = 1, limit = 20): Promise<any[]> {
    const res = await fetch(`${this.baseUrl}/sync/watchlist/${type}?extended=full&page=${page}&limit=${limit}`, {
      headers: this.headers(accessToken),
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return []
    return res.json()
  }

  /**
   * Get Trakt recommendations
   */
  async getRecommendations(accessToken: string, type: 'movies' | 'shows' = 'movies', page = 1, limit = 20): Promise<any[]> {
    const res = await fetch(`${this.baseUrl}/recommendations/${type}?extended=full&page=${page}&limit=${limit}`, {
      headers: this.headers(accessToken),
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return []
    return res.json()
  }

  /**
   * Scrobbler: Playback Started
   */
  async scrobbleStart(accessToken: string, payload: ScrobblePayload): Promise<any> {
    if (accessToken.startsWith('trakt_token_')) {
      return { action: 'start', progress: payload.progress, simulated: true }
    }
    const res = await fetch(`${this.baseUrl}/scrobble/start`, {
      method: 'POST',
      headers: this.headers(accessToken),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    })
    return res.json().catch(() => ({}))
  }

  /**
   * Scrobbler: Playback Paused
   */
  async scrobblePause(accessToken: string, payload: ScrobblePayload): Promise<any> {
    if (accessToken.startsWith('trakt_token_')) {
      return { action: 'pause', progress: payload.progress, simulated: true }
    }
    const res = await fetch(`${this.baseUrl}/scrobble/pause`, {
      method: 'POST',
      headers: this.headers(accessToken),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    })
    return res.json().catch(() => ({}))
  }

  /**
   * Scrobbler: Playback Stopped / Finished (watched)
   */
  async scrobbleStop(accessToken: string, payload: ScrobblePayload): Promise<any> {
    if (accessToken.startsWith('trakt_token_')) {
      return { action: 'stop', progress: payload.progress, simulated: true }
    }
    const res = await fetch(`${this.baseUrl}/scrobble/stop`, {
      method: 'POST',
      headers: this.headers(accessToken),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    })
    return res.json().catch(() => ({}))
  }
}

export const traktService = new TraktService()
