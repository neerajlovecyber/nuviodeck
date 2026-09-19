// Nuvio Public API Types based on docs/nuvio-api.md v1.3

export interface NuvioUser {
  id: string
  email: string
  created_at: string
}

export interface NuvioAuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  user: NuvioUser
}

export interface NuvioProfile {
  id: string
  user_id: string
  profile_index: number // 1 to 6
  name: string
  avatar_color_hex?: string | null
  uses_primary_addons?: boolean
  avatar_id?: string | null
  avatar_url?: string | null
  pin_enabled?: boolean
  pin_locked_until?: string | null
  created_at: string
  updated_at: string
}

export interface NuvioPushProfileInput {
  profile_index: number // 1 to 6
  name: string
  avatar_color_hex?: string | null
  uses_primary_addons?: boolean
  avatar_id?: string | null
  avatar_url?: string | null
}

export interface NuvioAddon {
  id: string
  user_id: string
  profile_id: number
  url: string
  name?: string | null
  enabled: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface NuvioPushAddonInput {
  url: string
  name?: string | null
  enabled?: boolean
  sort_order?: number
}

export interface CatalogSource {
  addonId: string
  type: string
  catalogId: string
}

export interface CollectionFolder {
  id: string
  title: string
  coverImageUrl?: string
  coverEmoji?: string
  tileShape?: 'POSTER' | 'LANDSCAPE' | 'SQUARE'
  hideTitle?: boolean
  catalogSources?: CatalogSource[]
}

export interface NuvioCollection {
  id: string
  title: string
  backdropImageUrl?: string
  pinToTop?: boolean
  viewMode?: 'TABBED_GRID' | 'ROWS' | 'FOLLOW_LAYOUT'
  showAllTab?: boolean
  folders: CollectionFolder[]
}

export interface NuvioProfileCollectionsResponse {
  profile_id: number
  collections_json: NuvioCollection[]
  updated_at: string
}

export interface NuvioAvatarCatalogItem {
  id: string
  display_name: string
  storage_path: string
  category: string
  sort_order: number
  is_active: boolean
  bg_color?: string | null
  created_at: string
}

export interface NuvioSyncOverview {
  addons: Record<string, number>
  library_items: Record<string, number>
  watch_progress: Record<string, number>
  watched_items: Record<string, number>
  profiles: Record<string, { name: string; color: string }>
}
