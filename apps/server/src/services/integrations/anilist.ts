export interface AniListMediaEntry {
  id: number
  status: 'CURRENT' | 'PLANNING' | 'COMPLETED' | 'DROPPED' | 'PAUSED'
  score?: number
  progress?: number
  media: {
    id: number
    idMal?: number
    title: {
      romaji: string
      english?: string
      native?: string
    }
    coverImage?: {
      large?: string
      medium?: string
    }
    bannerImage?: string
    episodes?: number
    format?: string
    genres?: string[]
    averageScore?: number
  }
}

export class AniListService {
  private graphqlEndpoint = 'https://graphql.anilist.co'
  private clientId: string

  constructor(clientId?: string) {
    this.clientId = clientId || process.env.ANILIST_CLIENT_ID || '18884'
  }

  getAuthUrl(redirectUri: string): string {
    return `https://anilist.co/api/v2/oauth/authorize?client_id=${this.clientId}&response_type=token`
  }

  async query<T>(queryStr: string, variables: Record<string, any> = {}, token?: string): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(this.graphqlEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: queryStr, variables }),
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      throw new Error(`AniList GraphQL error (${res.status})`)
    }

    const json = (await res.json()) as any
    if (json.errors && json.errors.length > 0) {
      throw new Error(json.errors[0].message)
    }
    return json.data
  }

  /**
   * Fetch current Viewer
   */
  async getViewer(token: string): Promise<any> {
    const q = `
      query {
        Viewer {
          id
          name
          avatar {
            large
            medium
          }
          bannerImage
          statistics {
            anime {
              count
              episodesWatched
              minutesWatched
            }
          }
        }
      }
    `
    const data = await this.query<{ Viewer: any }>(q, {}, token)
    return data.Viewer
  }

  /**
   * Fetch user anime list entries
   * status: 'CURRENT' (watching), 'PLANNING' (plan to watch), 'COMPLETED'
   */
  async getAnimeList(token: string, status?: 'CURRENT' | 'PLANNING' | 'COMPLETED'): Promise<AniListMediaEntry[]> {
    const viewer = await this.getViewer(token)
    if (!viewer?.id) return []

    const q = `
      query ($userId: Int, $status: MediaListStatus) {
        MediaListCollection(userId: $userId, type: ANIME, status: $status) {
          lists {
            name
            status
            entries {
              id
              status
              score
              progress
              media {
                id
                idMal
                title {
                  romaji
                  english
                  native
                }
                coverImage {
                  large
                  medium
                }
                bannerImage
                episodes
                format
                genres
                averageScore
              }
            }
          }
        }
      }
    `

    const data = await this.query<any>(q, { userId: viewer.id, status }, token)
    const lists = data?.MediaListCollection?.lists || []
    const allEntries: AniListMediaEntry[] = []
    for (const l of lists) {
      if (Array.isArray(l.entries)) {
        allEntries.push(...l.entries)
      }
    }
    return allEntries
  }

  /**
   * Update episode watch progress and status on AniList (matching AnilistStream implementation)
   */
  async updateProgress(
    token: string,
    mediaId: number,
    progress: number,
    status: 'CURRENT' | 'COMPLETED' = 'CURRENT'
  ): Promise<any> {
    const mutation = `
      mutation ($mediaId: Int!, $progress: Int!, $status: MediaListStatus) {
        SaveMediaListEntry(mediaId: $mediaId, progress: $progress, status: $status) {
          id
          status
          progress
        }
      }
    `
    return this.query<any>(mutation, { mediaId, progress, status }, token)
  }

  /**
   * Search anime by title
   */
  async searchAnime(title: string): Promise<AniListMediaEntry['media'][]> {
    const q = `
      query ($search: String) {
        Page(page: 1, perPage: 10) {
          media(search: $search, type: ANIME) {
            id
            idMal
            title {
              romaji
              english
              native
            }
            coverImage {
              large
              medium
            }
            bannerImage
            episodes
            format
            genres
            averageScore
          }
        }
      }
    `
    const data = await this.query<any>(q, { search: title })
    return data?.Page?.media || []
  }
}

export const anilistService = new AniListService()

