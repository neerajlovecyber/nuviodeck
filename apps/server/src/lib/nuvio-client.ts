import { config } from '../config'
import { handleApiResponse, NuvioApiError } from './errors'
import type {
  NuvioAuthResponse,
  NuvioUser,
  NuvioProfile,
  NuvioPushProfileInput,
  NuvioAddon,
  NuvioPushAddonInput,
  NuvioProfileCollectionsResponse,
  NuvioCollection,
  NuvioAvatarCatalogItem,
  NuvioSyncOverview,
} from '../types/nuvio'

export class NuvioClient {
  private baseUrl: string
  private publishableKey: string

  constructor(
    baseUrl: string = config.nuvio.baseUrl,
    publishableKey: string = config.nuvio.publishableKey
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.publishableKey = publishableKey
  }

  private headers(accessToken?: string): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: this.publishableKey,
    }
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }
    return headers
  }

  // --- Auth Endpoints ---

  async signInWithPassword(email: string, password: string): Promise<NuvioAuthResponse> {
    const res = await fetch(`${this.baseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ email, password }),
    })
    return handleApiResponse<NuvioAuthResponse>(res)
  }

  async signUpWithPassword(email: string, password: string): Promise<NuvioAuthResponse> {
    const res = await fetch(`${this.baseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ email, password }),
    })
    return handleApiResponse<NuvioAuthResponse>(res)
  }

  async refreshToken(refreshToken: string): Promise<NuvioAuthResponse> {
    const res = await fetch(`${this.baseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    return handleApiResponse<NuvioAuthResponse>(res)
  }

  async getCurrentUser(accessToken: string): Promise<NuvioUser> {
    const res = await fetch(`${this.baseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: this.headers(accessToken),
    })
    return handleApiResponse<NuvioUser>(res)
  }

  async signOut(accessToken: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/auth/v1/logout`, {
      method: 'POST',
      headers: this.headers(accessToken),
    })
    await handleApiResponse<void>(res)
  }

  // --- Profiles Endpoints ---

  async pullProfiles(accessToken: string): Promise<NuvioProfile[]> {
    const res = await fetch(`${this.baseUrl}/rest/v1/rpc/sync_pull_profiles`, {
      method: 'POST',
      headers: this.headers(accessToken),
    })
    return handleApiResponse<NuvioProfile[]>(res)
  }

  async pushProfiles(
    accessToken: string,
    profiles: NuvioPushProfileInput[],
    clientMaxProfiles = 6
  ): Promise<void> {
    const res = await fetch(`${this.baseUrl}/rest/v1/rpc/sync_push_profiles`, {
      method: 'POST',
      headers: this.headers(accessToken),
      body: JSON.stringify({
        p_client_max_profiles: clientMaxProfiles,
        p_profiles: profiles,
      }),
    })
    await handleApiResponse<void>(res)
  }

  async deleteProfileData(accessToken: string, profileIndex: number): Promise<void> {
    const res = await fetch(`${this.baseUrl}/rest/v1/rpc/sync_delete_profile_data`, {
      method: 'POST',
      headers: this.headers(accessToken),
      body: JSON.stringify({ p_profile_id: profileIndex }),
    })
    await handleApiResponse<void>(res)
  }

  // Safe helper: updates only one profile's fields without deleting or altering others
  async updateSingleProfile(
    accessToken: string,
    profileIndex: number,
    updates: Partial<NuvioPushProfileInput>
  ): Promise<NuvioProfile[]> {
    const existing = await this.pullProfiles(accessToken)
    const target = existing.find((p) => p.profile_index === profileIndex)
    if (!target) {
      throw new NuvioApiError(`Profile at index ${profileIndex} not found`, 404)
    }

    const payloadProfiles: NuvioPushProfileInput[] = existing.map((p) => {
      if (p.profile_index === profileIndex) {
        return {
          profile_index: p.profile_index,
          name: updates.name !== undefined ? updates.name : p.name,
          avatar_color_hex:
            updates.avatar_color_hex !== undefined
              ? updates.avatar_color_hex
              : p.avatar_color_hex,
          uses_primary_addons:
            updates.uses_primary_addons !== undefined
              ? updates.uses_primary_addons
              : p.uses_primary_addons,
          avatar_id:
            updates.avatar_id !== undefined ? updates.avatar_id : p.avatar_id,
          avatar_url:
            updates.avatar_url !== undefined ? updates.avatar_url : p.avatar_url,
        }
      }
      return {
        profile_index: p.profile_index,
        name: p.name,
        avatar_color_hex: p.avatar_color_hex,
        uses_primary_addons: p.uses_primary_addons,
        avatar_id: p.avatar_id,
        avatar_url: p.avatar_url,
      }
    })

    await this.pushProfiles(accessToken, payloadProfiles, 6)
    return this.pullProfiles(accessToken)
  }

  // --- Avatars Catalog ---

  async getAvatarCatalog(): Promise<NuvioAvatarCatalogItem[]> {
    const res = await fetch(`${this.baseUrl}/rest/v1/rpc/get_avatar_catalog`, {
      method: 'POST',
      headers: this.headers(),
    })
    return handleApiResponse<NuvioAvatarCatalogItem[]>(res)
  }

  // --- Addons Endpoints ---

  async listAddons(accessToken: string, profileIndex: number): Promise<NuvioAddon[]> {
    const res = await fetch(
      `${this.baseUrl}/rest/v1/addons?select=*&profile_id=eq.${profileIndex}&order=sort_order`,
      {
        method: 'GET',
        headers: this.headers(accessToken),
      }
    )
    return handleApiResponse<NuvioAddon[]>(res)
  }

  async pushAddons(
    accessToken: string,
    profileIndex: number,
    addons: NuvioPushAddonInput[]
  ): Promise<void> {
    const res = await fetch(`${this.baseUrl}/rest/v1/rpc/sync_push_addons`, {
      method: 'POST',
      headers: this.headers(accessToken),
      body: JSON.stringify({
        p_profile_id: profileIndex,
        p_addons: addons,
      }),
    })
    await handleApiResponse<void>(res)
  }

  // Safe helper: appends or updates an addon by URL, preserving existing ones
  async appendOrUpdateAddon(
    accessToken: string,
    profileIndex: number,
    newAddon: NuvioPushAddonInput
  ): Promise<NuvioAddon[]> {
    const existing = await this.listAddons(accessToken, profileIndex)
    const existingIndex = existing.findIndex((a) => a.url === newAddon.url)

    let updatedAddons: NuvioPushAddonInput[] = existing.map((a) => ({
      url: a.url,
      name: a.name,
      enabled: a.enabled,
      sort_order: a.sort_order,
    }))

    if (existingIndex >= 0) {
      updatedAddons[existingIndex] = {
        ...updatedAddons[existingIndex],
        ...newAddon,
      }
    } else {
      updatedAddons.push({
        url: newAddon.url,
        name: newAddon.name || '',
        enabled: newAddon.enabled ?? true,
        sort_order: newAddon.sort_order ?? updatedAddons.length,
      })
    }

    await this.pushAddons(accessToken, profileIndex, updatedAddons)
    return this.listAddons(accessToken, profileIndex)
  }

  // --- Collections Endpoints ---

  async pullCollections(
    accessToken: string,
    profileIndex: number
  ): Promise<NuvioProfileCollectionsResponse[]> {
    const res = await fetch(`${this.baseUrl}/rest/v1/rpc/sync_pull_collections`, {
      method: 'POST',
      headers: this.headers(accessToken),
      body: JSON.stringify({ p_profile_id: profileIndex }),
    })
    return handleApiResponse<NuvioProfileCollectionsResponse[]>(res)
  }

  async pushCollections(
    accessToken: string,
    profileIndex: number,
    collections: NuvioCollection[]
  ): Promise<void> {
    const res = await fetch(`${this.baseUrl}/rest/v1/rpc/sync_push_collections`, {
      method: 'POST',
      headers: this.headers(accessToken),
      body: JSON.stringify({
        p_profile_id: profileIndex,
        p_collections_json: collections,
      }),
    })
    await handleApiResponse<void>(res)
  }

  // Safe helper: append collection
  async appendCollection(
    accessToken: string,
    profileIndex: number,
    collection: NuvioCollection
  ): Promise<NuvioCollection[]> {
    const currentRes = await this.pullCollections(accessToken, profileIndex)
    const currentCollections: NuvioCollection[] =
      currentRes[0]?.collections_json || []

    const next = [...currentCollections, collection]
    await this.pushCollections(accessToken, profileIndex, next)
    return next
  }

  // --- Profile Settings & Badges ---

  async pullProfileSettings(
    accessToken: string,
    profileIndex: number,
    platform = 'tv'
  ): Promise<any> {
    const res = await fetch(
      `${this.baseUrl}/rest/v1/rpc/sync_pull_profile_settings_blob`,
      {
        method: 'POST',
        headers: this.headers(accessToken),
        body: JSON.stringify({
          p_profile_id: profileIndex,
          p_platform: platform,
        }),
      }
    )
    return handleApiResponse<any>(res)
  }

  async pushProfileSettings(
    accessToken: string,
    profileIndex: number,
    platform: string,
    settingsJson: Record<string, any>
  ): Promise<void> {
    const res = await fetch(
      `${this.baseUrl}/rest/v1/rpc/sync_push_profile_settings_blob`,
      {
        method: 'POST',
        headers: this.headers(accessToken),
        body: JSON.stringify({
          p_profile_id: profileIndex,
          p_platform: platform,
          p_settings_json: settingsJson,
        }),
      }
    )
    await handleApiResponse<void>(res)
  }

  // --- Overview & Health ---

  async getSyncOverview(accessToken: string): Promise<NuvioSyncOverview> {
    const res = await fetch(`${this.baseUrl}/rest/v1/rpc/get_sync_overview`, {
      method: 'POST',
      headers: this.headers(accessToken),
    })
    return handleApiResponse<NuvioSyncOverview>(res)
  }

  async healthPing(): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/rest/v1/rpc/health_ping`, {
      method: 'POST',
      headers: this.headers(),
    })
    return handleApiResponse<boolean>(res)
  }
}

export const nuvioClient = new NuvioClient()
