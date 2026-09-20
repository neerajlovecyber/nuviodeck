export class MyAnimeListService {
  private clientId: string
  private baseUrl = 'https://api.myanimelist.net/v2'

  constructor(clientId?: string) {
    this.clientId = clientId || process.env.MAL_CLIENT_ID || 'b72c91a0c7c34b1790ee0d1a49f6920f'
  }

  private headers(accessToken?: string): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    } else {
      headers['X-MAL-CLIENT-ID'] = this.clientId
    }
    return headers
  }

  /**
   * Get authenticated user profile info
   */
  async getUser(accessToken: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/users/@me`, {
      headers: this.headers(accessToken),
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) {
      throw new Error(`Failed to fetch MyAnimeList user profile (${res.status})`)
    }
    return res.json()
  }

  /**
   * Fetch user anime list
   * status: 'watching' | 'plan_to_watch' | 'completed' | 'on_hold' | 'dropped'
   */
  async getUserAnimeList(
    accessToken: string,
    status = 'watching',
    limit = 20
  ): Promise<any[]> {
    const url = `${this.baseUrl}/users/@me/animelist?status=${status}&limit=${limit}&fields=id,title,main_picture,alternative_titles,num_episodes,mean,status`
    const res = await fetch(url, {
      headers: this.headers(accessToken),
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return []
    const data = (await res.json()) as any
    return (data.data || []).map((item: any) => ({
      id: item.node.id,
      title: item.node.title,
      poster: item.node.main_picture?.large || item.node.main_picture?.medium,
      episodes: item.node.num_episodes,
      score: item.node.mean,
      listStatus: item.list_status?.status,
    }))
  }

  /**
   * Update episode count and status on MyAnimeList
   */
  async updateProgress(
    accessToken: string,
    animeId: number,
    episodeNumber: number,
    status: 'watching' | 'completed' = 'watching'
  ): Promise<any> {
    const url = `${this.baseUrl}/anime/${animeId}/my_list_status`
    const body = new URLSearchParams()
    body.set('num_watched_episodes', String(episodeNumber))
    body.set('status', status)

    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: body.toString(),
      signal: AbortSignal.timeout(4000),
    })
    return res.json().catch(() => ({}))
  }
}

export const myAnimeListService = new MyAnimeListService()

