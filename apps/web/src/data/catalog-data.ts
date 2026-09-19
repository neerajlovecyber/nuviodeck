export interface CatalogItem {
  id: string
  name: string
  category: string
  type: 'movie' | 'series' | 'both'
  description?: string
  isAi?: boolean
}

export interface CatalogCategory {
  id: string
  name: string
  items: CatalogItem[]
}

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: 'ai',
    name: 'AI GENERATED',
    items: [
      { id: 'ai-movies', name: 'AI for you - Movies', category: 'AI generated', type: 'movie', isAi: true },
      { id: 'ai-series', name: 'AI for you - Series', category: 'AI generated', type: 'series', isAi: true },
    ],
  },
  {
    id: 'trending',
    name: 'TRENDING',
    items: [
      { id: 'rec-series', name: 'Recommended For You - Series', category: 'Trending', type: 'series' },
      { id: 'rec-movies', name: 'Recommended For You - Movies', category: 'Trending', type: 'movie' },
      { id: 'foryou-movies', name: 'For You - Movies', category: 'Trending', type: 'movie' },
      { id: 'foryou-series', name: 'For You - Series', category: 'Trending', type: 'series' },
      { id: 'trend-series', name: 'Trending - Series', category: 'Trending', type: 'series' },
      { id: 'trend-movies', name: 'Trending - Movies', category: 'Trending', type: 'movie' },
      { id: 'popular-movies', name: 'Popular Movies This Week', category: 'Trending', type: 'movie' },
      { id: 'popular-tv', name: 'Popular TV Shows This Week', category: 'Trending', type: 'series' },
      { id: 'box-office', name: 'Box Office Top 10', category: 'Trending', type: 'movie' },
      { id: 'trakt-anticipated', name: 'Trakt Most Anticipated', category: 'Trending', type: 'both' },
    ],
  },
  {
    id: 'new_latest',
    name: 'NEW & LATEST',
    items: [
      { id: 'new-premieres', name: 'Brand New Premieres', category: 'New & Latest', type: 'both' },
      { id: 'digital-releases', name: 'Latest Digital Releases', category: 'New & Latest', type: 'movie' },
      { id: 'airing-today', name: 'Airing Today', category: 'New & Latest', type: 'series' },
      { id: 'just-added', name: 'Recently Added to Catalog', category: 'New & Latest', type: 'both' },
    ],
  },
  {
    id: 'streaming_top10',
    name: 'STREAMING TOP 10',
    items: [
      { id: 'top10-netflix', name: 'Netflix Top 10 Today', category: 'Streaming Top 10', type: 'both' },
      { id: 'top10-apple', name: 'Apple TV+ Chart Toppers', category: 'Streaming Top 10', type: 'both' },
      { id: 'top10-prime', name: 'Prime Video Top 10', category: 'Streaming Top 10', type: 'both' },
      { id: 'top10-disney', name: 'Disney+ Most Watched', category: 'Streaming Top 10', type: 'both' },
      { id: 'top10-hbo', name: 'HBO Max Global Top 10', category: 'Streaming Top 10', type: 'both' },
    ],
  },
  {
    id: 'streaming',
    name: 'STREAMING',
    items: [
      { id: 'netflix-originals', name: 'Netflix Originals', category: 'Streaming', type: 'both' },
      { id: 'apple-originals', name: 'Apple Originals & Prestige', category: 'Streaming', type: 'both' },
      { id: 'prime-exclusives', name: 'Prime Exclusives', category: 'Streaming', type: 'both' },
      { id: 'disney-featured', name: 'Disney+ Originals', category: 'Streaming', type: 'both' },
      { id: 'hbo-specials', name: 'HBO Prestige Drama', category: 'Streaming', type: 'series' },
      { id: 'paramount-hub', name: 'Paramount+ Showcase', category: 'Streaming', type: 'both' },
    ],
  },
  {
    id: 'genres',
    name: 'GENRES',
    items: [
      { id: 'genre-action', name: 'High-Octane Action', category: 'Genres', type: 'movie' },
      { id: 'genre-scifi', name: 'Sci-Fi & Cyberpunk Visions', category: 'Genres', type: 'both' },
      { id: 'genre-thriller', name: 'Mind-Bending Thrillers', category: 'Genres', type: 'both' },
      { id: 'genre-comedy', name: 'Top Rated Comedy', category: 'Genres', type: 'both' },
      { id: 'genre-horror', name: 'Modern Horror & Suspense', category: 'Genres', type: 'movie' },
      { id: 'genre-romance', name: 'Romantic Dramas', category: 'Genres', type: 'both' },
    ],
  },
  {
    id: 'anime',
    name: 'ANIME',
    items: [
      { id: 'anime-trend-series', name: 'Trending Anime - Series', category: 'Anime', type: 'series' },
      { id: 'anime-trend-movies', name: 'Trending Anime - Movies', category: 'Anime', type: 'movie' },
      { id: 'anime-seasonal', name: 'Current Season Simulcasts', category: 'Anime', type: 'series' },
      { id: 'anime-shonen', name: 'Top Shonen Anthems', category: 'Anime', type: 'series' },
      { id: 'anime-classics', name: 'Anime Masterpieces & Canon', category: 'Anime', type: 'both' },
      { id: 'anime-ghibli', name: 'Studio Ghibli Archive', category: 'Anime', type: 'movie' },
    ],
  },
  {
    id: 'world',
    name: 'WORLD',
    items: [
      { id: 'world-kdrama', name: 'Trending K-Dramas', category: 'World', type: 'series' },
      { id: 'world-indian', name: 'Indian Cinema Blockbusters', category: 'World', type: 'movie' },
      { id: 'world-nordic', name: 'Nordic Noir Mystery', category: 'World', type: 'series' },
      { id: 'world-british', name: 'British Mystery & Crime', category: 'World', type: 'series' },
      { id: 'world-french', name: 'French Cinema Classics', category: 'World', type: 'movie' },
    ],
  },
  {
    id: 'awards',
    name: 'AWARDS',
    items: [
      { id: 'awards-oscar-winners', name: 'Oscar Best Picture Winners', category: 'Awards', type: 'movie' },
      { id: 'awards-cannes', name: 'Cannes Palme d\'Or Laureates', category: 'Awards', type: 'movie' },
      { id: 'awards-emmy-drama', name: 'Emmy Best Drama Champions', category: 'Awards', type: 'series' },
    ],
  },
  {
    id: 'studios',
    name: 'STUDIOS',
    items: [
      { id: 'studio-a24', name: 'A24 Film Collection', category: 'Studios', type: 'movie' },
      { id: 'studio-marvel', name: 'Marvel Cinematic Universe', category: 'Studios', type: 'both' },
      { id: 'studio-dc', name: 'DC Worlds & Elseworlds', category: 'Studios', type: 'both' },
      { id: 'studio-pixar', name: 'Pixar Animation Archive', category: 'Studios', type: 'movie' },
    ],
  },
]

export interface CollectionFolder {
  id: string
  name: string
  logoText: string
  badgeText?: string
  bgGradient: string
  itemCount: number
}

export interface CollectionConfig {
  id: string
  name: string
  tileShape: 'Poster' | 'Landscape' | 'Square'
  pinToTop: boolean
  focusGlow: boolean
  allTab: boolean
  viewMode: 'Follow layout' | 'Rows' | 'Tabbed grid'
  backdropUrl: string
  folders: CollectionFolder[]
}

export const DEFAULT_COLLECTIONS: CollectionConfig[] = [
  {
    id: 'col-streaming',
    name: 'Streaming',
    tileShape: 'Landscape',
    pinToTop: true,
    focusGlow: true,
    allTab: true,
    viewMode: 'Follow layout',
    backdropUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=1920',
    folders: [
      {
        id: 'netflix',
        name: 'Netflix',
        logoText: 'NETFLIX',
        badgeText: 'GIF',
        bgGradient: 'from-black via-zinc-900 to-red-950',
        itemCount: 9,
      },
      {
        id: 'appletv',
        name: 'Apple TV+',
        logoText: 'tv',
        badgeText: 'GIF',
        bgGradient: 'from-zinc-900 via-stone-800 to-neutral-700',
        itemCount: 9,
      },
      {
        id: 'prime',
        name: 'Prime Video',
        logoText: 'prime video',
        badgeText: 'GIF',
        bgGradient: 'from-blue-950 via-slate-900 to-sky-950',
        itemCount: 9,
      },
      {
        id: 'jiohotstar',
        name: 'JioHotstar',
        logoText: 'JioHotstar',
        badgeText: 'GIF',
        bgGradient: 'from-indigo-950 via-purple-950 to-pink-950',
        itemCount: 7,
      },
    ],
  },
]
