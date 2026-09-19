import xperienceData from './xperience-catalogs.json'

export interface CatalogItem {
  id: string
  name: string
  category: string
  type: 'movie' | 'series' | 'both'
  source?: string
  requires?: string[]
  personalized?: boolean
  sourceParams?: Record<string, any>
  description?: string
  isAi?: boolean
}

export interface CatalogCategory {
  id: string
  name: string
  count: number
  items: CatalogItem[]
}

export interface PresetStartingPoint {
  id: string
  label: string
  hint: string
  rowIds: string[]
}

export interface CollectionFolder {
  id: string
  title: string
  badgeText: string
  logoText: string
  bgGradient: string
  gifUrl?: string
  tileShape?: 'POSTER' | 'LANDSCAPE' | 'SQUARE'
  coverSetId?: string | null
  catalogSources?: string[]
}

export interface CollectionConfig {
  id: string
  title: string
  tileShape: 'POSTER' | 'LANDSCAPE' | 'SQUARE'
  pinToTop: boolean
  focusGlow: boolean
  showAllTab: boolean
  viewMode: 'FOLLOW_LAYOUT' | 'ROWS' | 'TABBED_GRID'
  backdropUrl: string
  folders: CollectionFolder[]
}

export interface CoverSetInfo {
  id: string
  label: string
  tileShape?: 'POSTER' | 'LANDSCAPE' | 'SQUARE'
  description?: string
  dynamic?: boolean
  supporterOnly?: boolean
}

// Convert extracted Xperience catalogs into structured categories
const rawCatalogs = xperienceData.catalogs as Array<{
  id: string
  label: string
  category: string
  kind: 'movie' | 'series'
  source?: string
  source_params?: Record<string, any>
  requires?: string[]
  personalized?: boolean
}>

// Group by category
const categoryIdList = xperienceData.categories as string[]
const categoryLabelMap = xperienceData.categoryLabels as Record<string, string>

// Map raw catalogs to CatalogItem format
export const ALL_CATALOGS: CatalogItem[] = rawCatalogs.map((c) => ({
  id: c.id,
  name: c.label,
  category: categoryLabelMap[c.category] || c.category,
  type: c.kind === 'series' ? 'series' : 'movie',
  source: c.source,
  requires: c.requires || [],
  personalized: !!c.personalized,
  sourceParams: c.source_params || {},
  isAi: c.source === 'gemini' || c.category === 'ai_generated',
}))

export const CATALOG_MAP = new Map<string, CatalogItem>(
  ALL_CATALOGS.map((c) => [c.id, c])
)

// Categorized structure
export const CATALOG_CATEGORIES: CatalogCategory[] = categoryIdList
  .map((catId) => {
    const items = ALL_CATALOGS.filter((c) => {
      // match raw category id
      const raw = rawCatalogs.find((r) => r.id === c.id)
      return raw?.category === catId
    })

    return {
      id: catId,
      name: categoryLabelMap[catId] || catId,
      count: items.length,
      items,
    }
  })
  .filter((cat) => cat.items.length > 0)

// Official Xperience Starting Points Presets
export const XPERIENCE_PRESETS: PresetStartingPoint[] = (xperienceData.presets as Array<{
  id: string
  label: string
  hint: string
}>).map((p) => ({
  id: p.id,
  label: p.label,
  hint: p.hint,
  rowIds: (xperienceData.presetRows as Record<string, string[]>)[p.id] || [],
}))

export function getPresetRows(presetId: string): CatalogItem[] {
  const preset = XPERIENCE_PRESETS.find((p) => p.id === presetId)
  if (!preset) return []
  return preset.rowIds
    .map((id) => CATALOG_MAP.get(id))
    .filter((c): c is CatalogItem => !!c)
}

// Extracted Cover Sets from Xperience
export const COVER_SETS: CoverSetInfo[] = [
  { id: 'default', label: 'Default' },
  { id: 'kaptain_genres', label: "Kaptain's Genres", tileShape: 'LANDSCAPE' },
  { id: 'kaptain_trending', label: "Kaptain's Trending", tileShape: 'LANDSCAPE' },
  { id: 'kaptain_world_cinema', label: "Kaptain's World Cinema", tileShape: 'LANDSCAPE' },
  { id: 'kaptain_era_mixes', label: "Kaptain's Era Mixes", tileShape: 'LANDSCAPE' },
  { id: 'kaptain_anime', label: "Kaptain's Anime", tileShape: 'LANDSCAPE' },
  { id: 'kaptain_decades', label: "Kaptain's Decades", tileShape: 'LANDSCAPE' },
  { id: 'editorial', label: 'Editorial', tileShape: 'LANDSCAPE' },
  { id: 'editorial_portrait', label: 'Editorial Portrait', tileShape: 'POSTER' },
  { id: 'awards_portrait', label: 'Awards Portrait', tileShape: 'POSTER' },
  { id: 'mesh_nature', label: 'Mesh Nature', tileShape: 'LANDSCAPE' },
  { id: 'holographic', label: 'Holographic', tileShape: 'LANDSCAPE' },
  { id: 'holographic_portrait', label: 'Holographic Portrait', tileShape: 'POSTER' },
  { id: 'carbon_mono', label: 'Carbon Mono', tileShape: 'LANDSCAPE' },
  { id: 'carbon_mono_portrait', label: 'Carbon Mono Portrait', tileShape: 'POSTER' },
  { id: 'spotlight', label: 'Spotlight', tileShape: 'LANDSCAPE' },
  { id: 'spotlight_portrait', label: 'Spotlight Portrait', tileShape: 'POSTER' },
  { id: 'duotone', label: 'Duotone', tileShape: 'LANDSCAPE' },
  { id: 'duotone_portrait', label: 'Duotone Portrait', tileShape: 'POSTER' },
  { id: 'monogram', label: 'Monogram', tileShape: 'LANDSCAPE' },
  { id: 'monogram_portrait', label: 'Monogram Portrait', tileShape: 'POSTER' },
  { id: 'chromatic', label: 'Chromatic', tileShape: 'LANDSCAPE' },
  { id: 'chromatic_portrait', label: 'Chromatic Portrait', tileShape: 'POSTER' },
  { id: 'obsidian', label: 'Obsidian', tileShape: 'POSTER' },
  { id: 'key_art', label: 'Key Art', tileShape: 'LANDSCAPE' },
  { id: 'key_art_portrait', label: 'Key Art Portrait', tileShape: 'POSTER' },
  { id: 'dynamic_billboard', label: 'Dynamic Billboard', tileShape: 'LANDSCAPE', dynamic: true },
  { id: 'dynamic_wall', label: 'Dynamic Poster Wall', tileShape: 'LANDSCAPE', dynamic: true },
  { id: 'dynamic_duotone', label: 'Dynamic Duotone', tileShape: 'LANDSCAPE', dynamic: true },
  { id: 'dynamic_showcase', label: 'Dynamic Showcase', tileShape: 'LANDSCAPE', dynamic: true },
]

export const DEFAULT_COLLECTIONS: CollectionConfig[] = [
  {
    id: 'col-streaming',
    title: 'Streaming Hub',
    tileShape: 'LANDSCAPE',
    pinToTop: true,
    focusGlow: true,
    showAllTab: true,
    viewMode: 'FOLLOW_LAYOUT',
    backdropUrl:
      'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=2069&auto=format&fit=crop',
    folders: [
      {
        id: 'f-netflix',
        title: 'Netflix',
        badgeText: 'ORIGINALS & MOVIES',
        logoText: 'NETFLIX',
        bgGradient: 'from-red-900/80 via-black to-zinc-950',
        gifUrl: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif',
        tileShape: 'LANDSCAPE',
        catalogSources: ['streaming_netflix_movies', 'streaming_netflix_series'],
      },
      {
        id: 'f-apple',
        title: 'Apple TV+',
        badgeText: 'PRESTIGE SERIES',
        logoText: 'tv+',
        bgGradient: 'from-zinc-700/80 via-zinc-900 to-black',
        gifUrl: 'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif',
        tileShape: 'LANDSCAPE',
        catalogSources: ['streaming_apple_movies', 'streaming_apple_series'],
      },
      {
        id: 'f-disney',
        title: 'Disney+',
        badgeText: 'DISNEY · MARVEL · PIXAR',
        logoText: 'Disney+',
        bgGradient: 'from-blue-900/80 via-indigo-950 to-black',
        gifUrl: 'https://media.giphy.com/media/3o7TKMt1VVNkHV2PaE/giphy.gif',
        tileShape: 'LANDSCAPE',
        catalogSources: ['streaming_disney_movies', 'streaming_disney_series'],
      },
      {
        id: 'f-prime',
        title: 'Prime Video',
        badgeText: 'AMAZON EXCLUSIVES',
        logoText: 'prime video',
        bgGradient: 'from-sky-900/80 via-cyan-950 to-black',
        gifUrl: 'https://media.giphy.com/media/l41lI4bYmcsPJX9Go/giphy.gif',
        tileShape: 'LANDSCAPE',
        catalogSources: ['streaming_prime_movies', 'streaming_prime_series'],
      },
    ],
  },
]
