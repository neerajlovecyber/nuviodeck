export const POPULAR_LANGUAGES = [
  { code: 'en-US', name: 'English (United States)' },
  { code: 'en-GB', name: 'English (United Kingdom)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'es-MX', name: 'Spanish (Latin America)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'de-DE', name: 'German (Germany)' },
  { code: 'it-IT', name: 'Italian (Italy)' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'hi-IN', name: 'Hindi (India)' },
  { code: 'ja-JP', name: 'Japanese (Japan)' },
  { code: 'ko-KR', name: 'Korean (South Korea)' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'tr-TR', name: 'Turkish' },
  { code: 'ar-SA', name: 'Arabic' },
  { code: 'nl-NL', name: 'Dutch' },
]

export const GROQ_MODELS = [
  { id: 'openai/gpt-oss-120b', label: 'openai/gpt-oss-120b' },
  { id: 'openai/gpt-oss-20b', label: 'openai/gpt-oss-20b' },
]

export const GEMINI_MODELS = [
  { id: 'gemini-3.5-flash-lite', label: 'gemini-3.5-flash-lite' },
  { id: 'gemini-3.1-flash-lite', label: 'gemini-3.1-flash-lite' },
  { id: 'gemini-2.5-flash-lite', label: 'gemini-2.5-flash-lite' },
  { id: 'gemini-2.5-flash', label: 'gemini-2.5-flash' },
  { id: 'gemma-4-31b-it', label: 'gemma-4-31b-it' },
  { id: 'gemma-4-26b-a4b-it', label: 'gemma-4-26b-a4b-it' },
]

export const GENRES_LIST = [
  'Anime',
  'Animation',
  'Reality TV',
  'Talk Shows',
  'Kids',
  'Family',
  'Musical',
  'Documentary',
  'News',
  'Soap Operas',
  'Horror',
]

export const WIZARD_INFO_ITEMS: Record<
  string,
  { title: string; description: string; detail?: string }
> = {
  letterboxd: {
    title: 'Letterboxd Username',
    description: 'Your public Letterboxd username powers the "My Letterboxd Watchlist" catalog row.',
    detail: 'No password or token required. Only public lists and watchlists are fetched.',
  },
  trakt: {
    title: 'Trakt account',
    description: 'Connect your Trakt account to automatically sync your watchlist, ratings, and watch progress.',
    detail: 'Supports real-time scrobbling when watching in your player.',
  },
  'trakt-scrobble': {
    title: 'Scrobble now watching to Trakt',
    description: 'When you press play in your streaming app, report what you are currently watching to your Trakt account.',
  },
  simkl: {
    title: 'Simkl account',
    description: 'Link your Simkl account to bring your Plan to Watch lists, anime watching, and TV progress into catalog rows.',
  },
  anilist: {
    title: 'AniList account',
    description: 'Link your AniList account to sync your current anime watching progress, custom lists, and recommendations.',
  },
  myanimelist: {
    title: 'MyAnimeList account',
    description: 'Link your MyAnimeList account to sync your anime watching status and completed lists.',
  },
  'tmdb-account': {
    title: 'TMDB account',
    description: 'Connect your user TMDB account to import your TMDB favorites, custom lists, and rated titles.',
  },
}
