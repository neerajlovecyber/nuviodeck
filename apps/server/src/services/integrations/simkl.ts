export interface SimklPinResponse {
  user_code: string
  verification_url: string
  expires_in: number
  interval: number
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
   * Log playback to history
   */
  async addToHistory(accessToken: string, item: { ids: { simkl?: number; tmdb?: number; imdb?: string } }): Promise<any> {
    const res = await fetch(`${this.baseUrl}/sync/history`, {
      method: 'POST',
      headers: this.headers(accessToken),
      body: JSON.stringify({ movies: [item] }),
      signal: AbortSignal.timeout(4000),
    })
    return res.json().catch(() => ({}))
  }
}

export const simklService = new SimklService()
