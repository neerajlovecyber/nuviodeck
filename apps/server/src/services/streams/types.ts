export interface StremioStream {
  name: string
  title?: string
  description?: string
  url?: string
  externalUrl?: string
  infoHash?: string
  fileIdx?: number
  behaviorHints?: {
    defaultVideoId?: string
    bingeGroup?: string
    notWebReady?: boolean
    proxyHeaders?: Record<string, string>
  }
}

export type StreamResolution =
  | '2160p'
  | '1440p'
  | '1080p'
  | '720p'
  | '576p'
  | '480p'
  | 'unknown'

export type StreamQuality =
  | 'BluRay REMUX'
  | 'BluRay'
  | 'WEB-DL'
  | 'WEBRip'
  | 'HDTV'
  | 'DVDRip'
  | 'CAM'
  | 'TS'
  | 'SCR'
  | 'Unknown'

export type StreamVisualTag =
  | 'DV'
  | 'HDR10+'
  | 'HDR10'
  | 'HDR'
  | 'HLG'
  | '10bit'
  | 'IMAX'
  | '3D'

export type StreamAudioTag =
  | 'Atmos'
  | 'TrueHD'
  | 'DTS-HD MA'
  | 'DTS-HD'
  | 'DTS'
  | 'DD+'
  | 'DD'
  | 'AAC'
  | 'FLAC'
  | 'Opus'

export type StreamCodec = 'HEVC' | 'AVC' | 'AV1' | 'XviD'

export interface ParsedStreamMetadata {
  id: string
  sourceId: string
  sourceName: string
  debridService?: string
  cached: boolean
  rawTitle: string
  filename?: string
  title?: string
  year?: number
  season?: number
  episode?: number
  resolution: StreamResolution
  quality: StreamQuality
  visualTags: StreamVisualTag[]
  audioTags: StreamAudioTag[]
  audioChannels?: string
  codecs: StreamCodec[]
  languages: string[]
  languageEmojis: string[]
  sizeBytes?: number
  sizeFormatted?: string
  seeders?: number
  releaseGroup?: string
  indexer?: string
  ottPlatform?: string
  movieCut?: string
  url?: string
  infoHash?: string
  fileIdx?: number
  originalStream: StremioStream
}

export interface StreamFilterOptions {
  mostPerResolution?: number // default: 10
  maxPerService?: number // default: 0 (unlimited)
  cachedOnly?: boolean // default: false
  excludePreDigital?: boolean // default: false (filters CAM, TS, TC, HDTS, HDCAM, SCR, R5, DVDScr)
  excludeMismatchedTitles?: boolean // default: false
  targetTitle?: string // target movie/show title to match against
  excludedQualities?: string[] // default: ['CAM', 'TS', 'SCR']
  preferredLanguages?: string[]
  excludedLanguages?: string[]
  preferredPicture?: string[]
  excludedPicture?: string[]
  preferredCodecs?: string[]
  excludedCodecs?: string[]
}

export type StreamMergeStrategy = 'in_order' | 'interleaved' | 'priority'

export type StreamFormatterPreset =
  | 'nuvio'
  | 'prism'
  | 'xperience'
  | 'charcoal'
  | 'streamsense'
  | 'neds'
  | 'ned'
  | 'linden'
  | 'linden_monochrome'
  | 'lindenmono'
  | 'shota_simple'
  | 'shota'
  | 'tamtaro'
  | 'plain'

export interface StreamFormatterOptions {
  preset?: StreamFormatterPreset
  customTemplate?: string
  viewMode?: 'full' | 'episode' | 'sparse'
}

export interface StreamSourceConfig {
  id: string
  name: string
  type: 'comet' | 'stremthru' | 'mediafusion' | 'custom'
  url?: string
  enabled: boolean
  debridService?: 'torbox' | 'realdebrid' | 'alldebrid' | 'premiumize' | 'debridlink'
}

export interface StreamProxyConfig {
  enabled: boolean
  id: 'mediaflow' | 'stremthru' | 'generic'
  url: string
  apiPassword?: string
  publicUrl?: string
  proxiedServices?: string[]
}

export interface StreamsProfileConfig {
  enabled: boolean
  sources: StreamSourceConfig[]
  debridKeys?: Record<string, string> // e.g. { torbox: '...', realdebrid: '...' }
  filters?: StreamFilterOptions
  mergeStrategy?: StreamMergeStrategy
  formatter?: StreamFormatterOptions
  proxy?: StreamProxyConfig
}
