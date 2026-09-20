import { config } from '../../config'

export interface TmdbAccountSession {
  sessionId: string
  accountId: number
  username: string
  name: string
  includeAdult: boolean
  avatarUrl?: string
}

export class TmdbAccountService {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || config.tmdb.apiKey
    this.baseUrl = config.tmdb.baseUrl
  }

  /**
   * 1. Step 1: Create a temporary request token and auth URL for user to grant access
   */
  async createRequestToken(): Promise<{ requestToken: string; authUrl: string }> {
    const url = `${this.baseUrl}/authentication/token/new?api_key=${this.apiKey}`
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) {
      throw new Error(`Failed to create TMDB request token (${res.status})`)
    }
    const data = (await res.json()) as any
    const requestToken = data.request_token
    return {
      requestToken,
      authUrl: `https://www.themoviedb.org/authenticate/${requestToken}`,
    }
  }

  /**
   * 2. Step 2: Exchange approved request token for a permanent session ID
   */
  async createSession(requestToken: string): Promise<TmdbAccountSession> {
    const url = `${this.baseUrl}/authentication/session/new?api_key=${this.apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_token: requestToken }),
      signal: AbortSignal.timeout(4000),
    })

    if (!res.ok) {
      throw new Error(`Failed to create TMDB session (${res.status})`)
    }

    const sessionData = (await res.json()) as any
    const sessionId = sessionData.session_id

    // Fetch account details
    const account = await this.getAccountDetails(sessionId)
    return {
      sessionId,
      accountId: account.id,
      username: account.username,
      name: account.name || account.username,
      includeAdult: account.include_adult,
      avatarUrl: account.avatar?.tmdb?.avatar_path
        ? `${config.tmdb.imageBaseUrl}/w200${account.avatar.tmdb.avatar_path}`
        : undefined,
    }
  }

  /**
   * Fetch current account details using session ID
   */
  async getAccountDetails(sessionId: string): Promise<any> {
    const url = `${this.baseUrl}/account?api_key=${this.apiKey}&session_id=${sessionId}`
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) {
      throw new Error(`Failed to fetch TMDB account details (${res.status})`)
    }
    return res.json()
  }

  /**
   * Get user Watchlist
   */
  async getWatchlist(
    accountId: number | string,
    sessionId: string,
    type: 'movies' | 'tv',
    page = 1
  ): Promise<{ results: any[]; page: number; totalPages: number }> {
    const url = `${this.baseUrl}/account/${accountId}/watchlist/${type}?api_key=${this.apiKey}&session_id=${sessionId}&page=${page}&sort_by=created_at.desc`
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) {
      return { results: [], page: 1, totalPages: 1 }
    }
    const data = (await res.json()) as any
    return {
      results: data.results || [],
      page: data.page || page,
      totalPages: data.total_pages || 1,
    }
  }

  /**
   * Get user Favorites
   */
  async getFavorites(
    accountId: number | string,
    sessionId: string,
    type: 'movies' | 'tv',
    page = 1
  ): Promise<{ results: any[]; page: number; totalPages: number }> {
    const url = `${this.baseUrl}/account/${accountId}/favorite/${type}?api_key=${this.apiKey}&session_id=${sessionId}&page=${page}&sort_by=created_at.desc`
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) {
      return { results: [], page: 1, totalPages: 1 }
    }
    const data = (await res.json()) as any
    return {
      results: data.results || [],
      page: data.page || page,
      totalPages: data.total_pages || 1,
    }
  }

  /**
   * Get user Rated items
   */
  async getRated(
    accountId: number | string,
    sessionId: string,
    type: 'movies' | 'tv',
    page = 1
  ): Promise<{ results: any[]; page: number; totalPages: number }> {
    const url = `${this.baseUrl}/account/${accountId}/rated/${type}?api_key=${this.apiKey}&session_id=${sessionId}&page=${page}&sort_by=created_at.desc`
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) {
      return { results: [], page: 1, totalPages: 1 }
    }
    const data = (await res.json()) as any
    return {
      results: data.results || [],
      page: data.page || page,
      totalPages: data.total_pages || 1,
    }
  }

  /**
   * Get user custom lists
   */
  async getCustomLists(accountId: number | string, sessionId: string, page = 1): Promise<any[]> {
    const url = `${this.baseUrl}/account/${accountId}/lists?api_key=${this.apiKey}&session_id=${sessionId}&page=${page}`
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return []
    const data = (await res.json()) as any
    return data.results || []
  }

  /**
   * Add / Remove item from user Favorites
   */
  async setFavorite(
    accountId: number | string,
    sessionId: string,
    mediaType: 'movie' | 'tv',
    mediaId: number,
    favorite: boolean
  ): Promise<{ success: boolean; status_message?: string }> {
    const url = `${this.baseUrl}/account/${accountId}/favorite?api_key=${this.apiKey}&session_id=${sessionId}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: mediaType,
        media_id: mediaId,
        favorite,
      }),
      signal: AbortSignal.timeout(4000),
    })
    return res.json().catch(() => ({ success: false }))
  }

  /**
   * Add / Remove item from user Watchlist
   */
  async setWatchlist(
    accountId: number | string,
    sessionId: string,
    mediaType: 'movie' | 'tv',
    mediaId: number,
    watchlist: boolean
  ): Promise<{ success: boolean; status_message?: string }> {
    const url = `${this.baseUrl}/account/${accountId}/watchlist?api_key=${this.apiKey}&session_id=${sessionId}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: mediaType,
        media_id: mediaId,
        watchlist,
      }),
      signal: AbortSignal.timeout(4000),
    })
    return res.json().catch(() => ({ success: false }))
  }

  /**
   * Rate a movie or TV show (rating: 0.5 to 10.0)
   */
  async rateMedia(
    sessionId: string,
    mediaType: 'movie' | 'tv',
    mediaId: number,
    rating: number
  ): Promise<{ success: boolean; status_message?: string }> {
    const url = `${this.baseUrl}/${mediaType}/${mediaId}/rating?api_key=${this.apiKey}&session_id=${sessionId}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: rating }),
      signal: AbortSignal.timeout(4000),
    })
    return res.json().catch(() => ({ success: false }))
  }

  /**
   * Delete rating for a movie or TV show
   */
  async deleteRating(
    sessionId: string,
    mediaType: 'movie' | 'tv',
    mediaId: number
  ): Promise<{ success: boolean; status_message?: string }> {
    const url = `${this.baseUrl}/${mediaType}/${mediaId}/rating?api_key=${this.apiKey}&session_id=${sessionId}`
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(4000),
    })
    return res.json().catch(() => ({ success: false }))
  }
}

export const tmdbAccountService = new TmdbAccountService()
