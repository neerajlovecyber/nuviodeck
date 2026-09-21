import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PosterProvider {
  id: string
  name: string
  placeholder: string
  key: string
  linkUrl?: string
  linkText?: string
  verified: boolean
  active: boolean
  hasConfig?: boolean
}

export interface SettingsState {
  // API Keys
  apiKeys: {
    mdblist: string
    mdblistScrobble: boolean
    tmdb: string
    gemini: string
    groq: string
    deepseek: string
    letterboxd: string
  }
  setApiKey: (key: keyof SettingsState['apiKeys'], value: string | boolean) => void

  // Posters
  posterProviders: PosterProvider[]
  setPosterProviders: (providers: PosterProvider[]) => void
  updatePosterProviderKey: (id: string, key: string) => void
  showRatingsOnPosters: boolean
  setShowRatingsOnPosters: (val: boolean) => void
  badgedEpisodeStills: boolean
  setBadgedEpisodeStills: (val: boolean) => void

  // Profile defaults
  profileDefaults: {
    language: string
    fallbackLanguage: string
    timezone: string
    seriesSource: string
    animeSource: string
    animeNumbering: string
    fillerEpisodes: string
    animeStreamId: string
    animeTitles: string
    maxRating: string
    qualityFloor: string
    originCountries: string[]
    excludeCountries: string[]
    hideWatched: boolean
    hideCaughtUp: boolean
    excludeUnreleased: boolean
    preDigitalOnly: boolean
    hideAdult: boolean
    aiProvider: string
    aiModel: string
    enableAi: boolean
    enableAiSearch: boolean
  }
  setProfileDefault: <K extends keyof SettingsState['profileDefaults']>(
    key: K,
    value: SettingsState['profileDefaults'][K]
  ) => void

  // Appearance & Language
  appLanguage: string
  setAppLanguage: (lang: string) => void

  // Playback
  playbackCompletion: 'auto' | 'strict'
  setPlaybackCompletion: (mode: 'auto' | 'strict') => void

  // Account Connections
  connections: {
    nuvio: { connected: boolean; email: string; profilesCount: number }
    tmdb: { connected: boolean; username: string }
    trakt: { connected: boolean; username: string; scrobble: boolean }
    simkl: { connected: boolean; username: string }
    anilist: { connected: boolean; username: string }
    myanimelist: { connected: boolean; username: string }
  }
  setConnection: (
    provider: keyof SettingsState['connections'],
    data: Partial<SettingsState['connections'][keyof SettingsState['connections']]>
  ) => void
}

const INITIAL_PROVIDERS: PosterProvider[] = [
  {
    id: 'custom_url',
    name: 'Custom URL',
    placeholder: 'https://host/poster/{imdb_id}.jpg',
    key: '',
    verified: true,
    active: true,
  },
  {
    id: 'better_posters',
    name: 'BetterPosters',
    placeholder: 'poster url',
    linkUrl: 'https://btttr.cc/configure',
    linkText: 'Configure',
    key: '',
    verified: true,
    active: true,
    hasConfig: true,
  },
  {
    id: 'easyratings',
    name: 'EasyRatings',
    placeholder: 'token or poster url',
    linkUrl: 'https://easyratingsdb.com/configurator',
    linkText: 'Configure',
    key: '',
    verified: true,
    active: true,
  },
  {
    id: 'top_posters',
    name: 'Top Posters',
    placeholder: 'top posters api key',
    linkUrl: 'https://top-posters.com/',
    linkText: 'Get a key',
    key: '',
    verified: true,
    active: true,
  },
  {
    id: 'rpdb',
    name: 'RPDB',
    placeholder: 'rpdb api key',
    linkUrl: 'https://ratingposterdb.com/',
    linkText: 'Get a key',
    key: '',
    verified: false,
    active: false,
  },
  {
    id: 'omdb',
    name: 'OMDb',
    placeholder: 'omdb api key',
    linkUrl: 'https://www.omdbapi.com/apikey.aspx',
    linkText: 'Get a key',
    key: '',
    verified: false,
    active: false,
  },
  {
    id: 'fanart',
    name: 'Fanart.tv',
    placeholder: 'fanart api key',
    linkUrl: 'https://fanart.tv/get-an-api-key/',
    linkText: 'Get a key',
    key: '',
    verified: false,
    active: false,
  },
  {
    id: 'xrdb',
    name: 'XRDB',
    placeholder: 'https://xrdb-host or poster url',
    linkUrl: 'https://extendedratings.com/',
    linkText: 'Configure',
    key: '',
    verified: false,
    active: false,
  },
  {
    id: 'posters_plus',
    name: 'Posters+',
    placeholder: 'posters+ poster url',
    linkUrl: 'https://postersplus.elfhosted.com/',
    linkText: 'Configure',
    key: '',
    verified: false,
    active: false,
  },
]

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKeys: {
        mdblist: 'neerajlovecyber-5qsn6f',
        mdblistScrobble: true,
        tmdb: '••••••••••••••••••••••••••••••••',
        gemini: '••••••••••••••••••••••••••••••••',
        groq: '',
        deepseek: '',
        letterboxd: '',
      },
      setApiKey: (key, value) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [key]: value },
        })),

      posterProviders: INITIAL_PROVIDERS,
      setPosterProviders: (posterProviders) => set({ posterProviders }),
      updatePosterProviderKey: (id, key) =>
        set((state) => ({
          posterProviders: state.posterProviders.map((p) =>
            p.id === id ? { ...p, key, verified: key.trim().length > 0 } : p
          ),
        })),

      showRatingsOnPosters: false,
      setShowRatingsOnPosters: (showRatingsOnPosters) =>
        set({ showRatingsOnPosters }),

      badgedEpisodeStills: true,
      setBadgedEpisodeStills: (badgedEpisodeStills) =>
        set({ badgedEpisodeStills }),

      profileDefaults: {
        language: 'English',
        fallbackLanguage: 'English',
        timezone: 'Automatic (source air date)',
        seriesSource: 'TheTVDB (matches stream numbering)',
        animeSource: 'TheTVDB',
        animeNumbering: 'Absolute (1137)',
        fillerEpisodes: 'Tag ([Filler])',
        animeStreamId: 'IMDb (tt2098220:2:49)',
        animeTitles: 'Default (My Hero Academia)',
        maxRating: 'any',
        qualityFloor: 'Good (6.5+ rating, 100+ votes)',
        originCountries: [],
        excludeCountries: [],
        hideWatched: true,
        hideCaughtUp: true,
        excludeUnreleased: false,
        preDigitalOnly: true,
        hideAdult: false,
        aiProvider: 'Google Gemini',
        aiModel: 'gemini-3.5-flash-lite',
        enableAi: true,
        enableAiSearch: true,
      },
      setProfileDefault: (key, value) =>
        set((state) => ({
          profileDefaults: { ...state.profileDefaults, [key]: value },
        })),

      appLanguage: 'English',
      setAppLanguage: (appLanguage) => set({ appLanguage }),

      playbackCompletion: 'strict',
      setPlaybackCompletion: (playbackCompletion) =>
        set({ playbackCompletion }),

      connections: {
        nuvio: {
          connected: true,
          email: 'neerajlovecyber@gmail.com',
          profilesCount: 3,
        },
        tmdb: {
          connected: false,
          username: '',
        },
        trakt: {
          connected: true,
          username: 'Neerajlovecyber',
          scrobble: false,
        },
        simkl: {
          connected: false,
          username: '',
        },
        anilist: {
          connected: false,
          username: '',
        },
        myanimelist: {
          connected: false,
          username: '',
        },
      },
      setConnection: (provider, data) =>
        set((state) => ({
          connections: {
            ...state.connections,
            [provider]: { ...state.connections[provider], ...data },
          },
        })),
    }),
    {
      name: 'nuviodeck-settings',
    }
  )
)
