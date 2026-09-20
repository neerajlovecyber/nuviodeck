export interface SimklPinResponse {
  user_code: string
  verification_url: string
  expires_in: number
  interval: number
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
  private clientId: string
  private baseUrl = 'https://api.simkl.com'

  constructor(clientId?: string) {
    this.clientId =
      clientId ||
      process.env.SIMKL_CLIENT_ID ||
      '016027a421a1f044b7d19760773d74bc05eb8bb9325992a06144e0499e4b6c3d'
  }

  private headers(accessToken?: string): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'simkl-api-key': this.clientId,
    }
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }
    return headers
  }

  /**
   * 1. Get PIN code for user authentication at simkl.com/pin
   */
  async getPinCode(): Promise<SimklPinResponse> {
    const res = await fetch(`${this.baseUrl}/oauth/pin?client_id=${this.clientId}`, {
      method: 'GET',
      headers: this.headers(),
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      throw new Error(`Failed to generate Simkl PIN (${res.status})`)
    }
    return res.json()
  }

  /**
   * 2. Poll/exchange user_code for access token
   */
  async exchangePin(userCode: string): Promise<{ access_token?: string; result?: string }> {
    const res = await fetch(`${this.baseUrl}/oauth/pin/${userCode}?client_id=${this.clientId}`, {
      method: 'GET',
      headers: this.headers(),
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      throw new Error(`Simkl PIN verification failed (${res.status})`)
    }
    return res.json()
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
