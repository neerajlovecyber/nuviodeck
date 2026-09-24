import { CatalogItem, CollectionConfig } from '@/data/catalog-data'
import { PosterProvider } from '@/store/useSettingsStore'
import { DeckProfile } from '@/lib/nuvio-api'

export type WizardStep = 1 | 2 | 3 | 4 | 5

export interface RowFilterConfig {
  minRating?: number
  minVotes?: number
  yearFrom?: number
  yearTo?: number
  sortBy?: string
  customTitle?: string
}

export interface StreamSourceConfig {
  id: string
  name: string
  type: 'torrentio' | 'comet' | 'mediafusion' | 'stremthru' | 'custom'
  url: string
  enabled: boolean
  description: string
}

export type DebridProviderType =
  | 'realdebrid'
  | 'torbox'
  | 'alldebrid'
  | 'premiumize'
  | 'debridlink'
  | 'none'

export type StreamFormatterPreset =
  | 'nuvio'
  | 'prism'
  | 'charcoal'
  | 'streamsense'
  | 'ned'
  | 'linden'
  | 'shota'
  | 'tamtaro'
  | 'plain'

export type StreamProxyType = 'mediaflow' | 'stremthru' | 'generic'

export type ConnectProviderType =
  | 'trakt'
  | 'simkl'
  | 'anilist'
  | 'myanimelist'
  | 'tmdb'
