// Frontend typed client communicating with our Nuviodeck server (/api/nuvio/*)

export interface NuvioProfile {
  id: string
  user_id: string
  profile_index: number
  name: string
  avatar_color_hex?: string | null
  uses_primary_addons?: boolean
  avatar_id?: string | null
  avatar_url?: string | null
  pin_enabled?: boolean
  pin_locked_until?: string | null
}

export interface NuvioAddon {
  id: string
  profile_id: number
  url: string
  name?: string | null
  enabled: boolean
  sort_order: number
}

export interface NuvioCollection {
  id: string
  title: string
  backdropImageUrl?: string
  pinToTop?: boolean
  viewMode?: 'TABBED_GRID' | 'ROWS' | 'FOLLOW_LAYOUT'
  showAllTab?: boolean
  folders: any[]
}

export class NuvioApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`)
    }
    return data as T
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{
      success: boolean
      accessToken: string
      refreshToken: string
      user: any
      sessionId?: string
    }>('/api/nuvio/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async getSession() {
    return this.request<{ session: any | null }>('/api/nuvio/auth/session')
  }

  async getMe() {
    return this.request<{ user: any }>('/api/nuvio/auth/me')
  }

  async logout() {
    return this.request<{ success: boolean }>('/api/nuvio/auth/logout', {
      method: 'POST',
    })
  }

  // Profiles
  async getProfiles() {
    return this.request<{ profiles: NuvioProfile[] }>('/api/nuvio/profiles')
  }

  async updateProfile(profileIndex: number, updates: Partial<NuvioProfile>) {
    return this.request<{ success: boolean; profile: NuvioProfile; profiles: NuvioProfile[] }>(
      `/api/nuvio/profiles/${profileIndex}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }
    )
  }

  async updateAvatar(
    profileIndex: number,
    avatar: { avatar_id?: string | null; avatar_url?: string | null; avatar_color_hex?: string }
  ) {
    return this.request<{
      success: boolean
      message: string
      profile: NuvioProfile
      profiles: NuvioProfile[]
    }>(`/api/nuvio/profiles/${profileIndex}/avatar`, {
      method: 'PATCH',
      body: JSON.stringify(avatar),
    })
  }

  async getAvatarCatalog() {
    return this.request<{ catalog: any[] }>('/api/nuvio/profiles/catalog/all')
  }

  // Addons
  async getAddons(profileIndex: number) {
    return this.request<{ profileIndex: number; addons: NuvioAddon[] }>(
      `/api/nuvio/addons/${profileIndex}`
    )
  }

  async appendAddon(
    profileIndex: number,
    addon: { url: string; name?: string; enabled?: boolean; sort_order?: number }
  ) {
    return this.request<{ success: boolean; profileIndex: number; addons: NuvioAddon[] }>(
      `/api/nuvio/addons/${profileIndex}`,
      {
        method: 'POST',
        body: JSON.stringify(addon),
      }
    )
  }

  async replaceAddons(profileIndex: number, addons: any[]) {
    return this.request<{ success: boolean; profileIndex: number; addons: NuvioAddon[] }>(
      `/api/nuvio/addons/${profileIndex}`,
      {
        method: 'PUT',
        body: JSON.stringify({ addons }),
      }
    )
  }

  async toggleAddon(profileIndex: number, url: string, enabled?: boolean) {
    return this.request<{ success: boolean; profileIndex: number; addons: NuvioAddon[] }>(
      `/api/nuvio/addons/${profileIndex}/toggle`,
      {
        method: 'PATCH',
        body: JSON.stringify({ url, enabled }),
      }
    )
  }

  async deleteAddon(profileIndex: number, url: string) {
    return this.request<{ success: boolean; profileIndex: number; addons: NuvioAddon[] }>(
      `/api/nuvio/addons/${profileIndex}`,
      {
        method: 'DELETE',
        body: JSON.stringify({ url }),
      }
    )
  }

  // Collections
  async getCollections(profileIndex: number) {
    return this.request<{ profileIndex: number; collections: NuvioCollection[] }>(
      `/api/nuvio/collections/${profileIndex}`
    )
  }

  async replaceCollections(profileIndex: number, collections: NuvioCollection[]) {
    return this.request<{
      success: boolean
      profileIndex: number
      collections: NuvioCollection[]
    }>(`/api/nuvio/collections/${profileIndex}`, {
      method: 'PUT',
      body: JSON.stringify({ collections }),
    })
  }

  async appendCollection(profileIndex: number, collection: Partial<NuvioCollection>) {
    return this.request<{
      success: boolean
      profileIndex: number
      collections: NuvioCollection[]
    }>(`/api/nuvio/collections/${profileIndex}`, {
      method: 'POST',
      body: JSON.stringify(collection),
    })
  }

  async updateCollection(
    profileIndex: number,
    collectionId: string,
    updates: Partial<NuvioCollection>
  ) {
    return this.request<{
      success: boolean
      profileIndex: number
      collection: NuvioCollection
    }>(`/api/nuvio/collections/${profileIndex}/${collectionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async deleteCollection(profileIndex: number, collectionId: string) {
    return this.request<{
      success: boolean
      profileIndex: number
      collections: NuvioCollection[]
    }>(`/api/nuvio/collections/${profileIndex}/${collectionId}`, {
      method: 'DELETE',
    })
  }

  // Badges
  async getBadgePresets() {
    return this.request<{ presets: any[] }>('/api/badges/presets')
  }

  async syncBadgeToNuvio(profileIndex: number, presetId: string, badgeUrl: string) {
    return this.request<{ success: boolean; message: string; settings: any }>(
      `/api/badges/sync/${profileIndex}`,
      {
        method: 'POST',
        body: JSON.stringify({ presetId, badgeUrl }),
      }
    )
  }

  // Sync Overview & Health
  async getSyncOverview() {
    return this.request<{ overview: any }>('/api/nuvio/sync/overview')
  }

  async getHealth() {
    return this.request<{ status: string; connected: boolean; timestamp: string }>(
      '/api/nuvio/sync/health'
    )
  }
}

export const nuvioApi = new NuvioApiClient()
