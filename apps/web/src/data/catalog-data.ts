import { useQuery } from '@tanstack/react-query'

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

// Lightweight immediate fallback categories while backend registry hydrates
export const FALLBACK_CATEGORIES: CatalogCategory[] = [
  {
    id: 'for_you_trending',
    name: 'For You & Trending',
    count: 6,
    items: [
      { id: 'trending_movies', name: 'Trending Movies', category: 'For You & Trending', type: 'movie', source: 'tmdb' },
      { id: 'trending_series', name: 'Trending Series', category: 'For You & Trending', type: 'series', source: 'tmdb' },
      { id: 'snoak_top100_movies', name: 'Top 100 Movies Today', category: 'For You & Trending', type: 'movie', source: 'mdblist' },
      { id: 'snoak_top100_series', name: 'Top 100 Shows Today', category: 'For You & Trending', type: 'series', source: 'mdblist' },
      { id: 'top_rated_movies', name: 'Top Rated Movies', category: 'For You & Trending', type: 'movie', source: 'tmdb' },
      { id: 'top_rated_series', name: 'Top Rated Series', category: 'For You & Trending', type: 'series', source: 'tmdb' },
    ],
  },
  {
    id: 'streaming_providers',
    name: 'Streaming Services',
    count: 8,
    items: [
      { id: 'streaming_netflix_movies', name: 'Netflix Movies', category: 'Streaming Services', type: 'movie', source: 'tmdb' },
      { id: 'streaming_netflix_series', name: 'Netflix Series', category: 'Streaming Services', type: 'series', source: 'tmdb' },
      { id: 'streaming_apple_movies', name: 'Apple TV+ Movies', category: 'Streaming Services', type: 'movie', source: 'tmdb' },
      { id: 'streaming_apple_series', name: 'Apple TV+ Series', category: 'Streaming Services', type: 'series', source: 'tmdb' },
      { id: 'streaming_disney_movies', name: 'Disney+ Movies', category: 'Streaming Services', type: 'movie', source: 'tmdb' },
      { id: 'streaming_disney_series', name: 'Disney+ Series', category: 'Streaming Services', type: 'series', source: 'tmdb' },
      { id: 'streaming_prime_movies', name: 'Prime Video Movies', category: 'Streaming Services', type: 'movie', source: 'tmdb' },
      { id: 'streaming_prime_series', name: 'Prime Video Series', category: 'Streaming Services', type: 'series', source: 'tmdb' },
    ],
  },
  {
    id: 'studios',
    name: 'Studios & Labels',
    count: 6,
    items: [
      { id: 'studio_a24_movies', name: 'A24 Films', category: 'Studios & Labels', type: 'movie', source: 'tmdb' },
      { id: 'studio_marvel_movies', name: 'Marvel Studios', category: 'Studios & Labels', type: 'movie', source: 'tmdb' },
      { id: 'studio_pixar_movies', name: 'Pixar Animation', category: 'Studios & Labels', type: 'movie', source: 'tmdb' },
      { id: 'studio_ghibli_movies', name: 'Studio Ghibli', category: 'Studios & Labels', type: 'movie', source: 'tmdb' },
      { id: 'studio_warner_movies', name: 'Warner Bros. Pictures', category: 'Studios & Labels', type: 'movie', source: 'tmdb' },
      { id: 'studio_blumhouse_movies', name: 'Blumhouse Productions', category: 'Studios & Labels', type: 'movie', source: 'tmdb' },
    ],
  },
]

export const CATALOG_CATEGORIES = FALLBACK_CATEGORIES

export const ALL_CATALOGS = FALLBACK_CATEGORIES.flatMap((c) => c.items)
export const CATALOG_MAP = new Map<string, CatalogItem>(ALL_CATALOGS.map((c) => [c.id, c]))

// Starting Point Presets
export const XPERIENCE_PRESETS: PresetStartingPoint[] = [
  {
    id: 'balanced',
    label: 'Everyday Mix',
    hint: 'A little of everything: trending, popular, and big streamers.',
    rowIds: [
      'trending_movies',
      'trending_series',
      'snoak_top100_movies',
      'snoak_top100_series',
      'streaming_netflix_movies',
      'streaming_netflix_series',
    ],
  },
  {
    id: 'movie_lover',
    label: 'Cinephile',
    hint: 'Movie-forward feed: prestige studios, awards, and trending cinema.',
    rowIds: [
      'trending_movies',
      'snoak_top100_movies',
      'top_rated_movies',
      'studio_a24_movies',
      'studio_marvel_movies',
    ],
  },
  {
    id: 'series_binger',
    label: 'TV Marathon',
    hint: 'Series-only feed tuned for current and popular television.',
    rowIds: [
      'trending_series',
      'snoak_top100_series',
      'top_rated_series',
      'streaming_netflix_series',
      'streaming_apple_series',
    ],
  },
]

export function getPresetRows(presetId: string, customCategories?: CatalogCategory[]): CatalogItem[] {
  const preset = XPERIENCE_PRESETS.find((p) => p.id === presetId)
  if (!preset) return []

  const allItems = (customCategories || FALLBACK_CATEGORIES).flatMap((c) => c.items)
  const map = new Map(allItems.map((i) => [i.id, i]))

  return preset.rowIds
    .map((id) => map.get(id) || { id, name: id.replace(/_/g, ' '), category: 'Curated', type: 'movie' as const })
}

/**
 * Hook to dynamically load all 1,133+ catalog definitions from the backend single-source of truth.
 * Uses TanStack Query with 24-hour browser caching.
 */
export function useCatalogRegistry() {
  return useQuery({
    queryKey: ['catalogRegistry'],
    queryFn: async () => {
      const res = await fetch('/api/catalogs/registry')
      if (!res.ok) {
        throw new Error(`Failed to load catalog registry (${res.status})`)
      }
      return (await res.json()) as {
        total: number
        categories: CatalogCategory[]
        categoryDirectory: Array<{ id: string; name: string; count: number }>
        presets?: Array<{ id: string; label: string; hint: string }>
        presetRows?: Record<string, string[]>
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}

// Visual Cover Art Sets
export const COVER_SETS: CoverSetInfo[] = [
  { id: 'default', label: 'Default' },
  { id: 'kaptain_genres', label: "Kaptain's Genres", tileShape: 'LANDSCAPE' },
  { id: 'kaptain_trending', label: "Kaptain's Trending", tileShape: 'LANDSCAPE' },
  { id: 'editorial', label: 'Editorial', tileShape: 'LANDSCAPE' },
  { id: 'editorial_portrait', label: 'Editorial Portrait', tileShape: 'POSTER' },
  { id: 'awards_portrait', label: 'Awards Portrait', tileShape: 'POSTER' },
  { id: 'carbon_mono', label: 'Carbon Mono', tileShape: 'LANDSCAPE' },
  { id: 'holographic', label: 'Holographic', tileShape: 'LANDSCAPE' },
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
