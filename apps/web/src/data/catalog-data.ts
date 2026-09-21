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

import xperienceRaw from './xperience-catalogs.json'

const rawCategories = (xperienceRaw.categories || []) as string[]
const rawCategoryLabels = (xperienceRaw.categoryLabels || {}) as Record<string, string>
const rawCatalogs = (xperienceRaw.catalogs || []) as any[]

export const PARSED_CATEGORIES: CatalogCategory[] = rawCategories
  .map((catId) => {
    const items: CatalogItem[] = rawCatalogs
      .filter((c) => c.category === catId)
      .map((c) => ({
        id: c.id,
        name: c.label,
        category: rawCategoryLabels[catId] || catId,
        type: c.kind === 'series' ? 'series' : 'movie',
        source: c.source,
        requires: c.requires,
        sourceParams: c.source_params,
        personalized: c.personalized,
      }))
    return {
      id: catId,
      name: rawCategoryLabels[catId] || catId,
      count: items.length,
      items,
    }
  })
  .filter((c) => c.items.length > 0)

export const FALLBACK_CATEGORIES: CatalogCategory[] = PARSED_CATEGORIES

export const CATALOG_CATEGORIES = PARSED_CATEGORIES

export const ALL_CATALOGS = PARSED_CATEGORIES.flatMap((c) => c.items)
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
