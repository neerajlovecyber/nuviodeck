import * as React from 'react'
import { toast } from 'sonner'
import { nuvioApi, DeckProfile } from '@/lib/nuvio-api'
import {
  CATALOG_CATEGORIES,
  DEFAULT_COLLECTIONS,
  CatalogItem,
  CollectionConfig,
  XPERIENCE_PRESETS,
  getPresetRows,
  useCatalogRegistry,
} from '@/data/catalog-data'
import { INITIAL_POSTER_PROVIDERS, PosterProvider, useSettingsStore } from '@/store/useSettingsStore'
import {
  WizardStep,
  RowFilterConfig,
  StreamSourceConfig,
  DebridProviderType,
  StreamFormatterPreset,
  StreamProxyType,
  ConnectProviderType,
} from './wizard-types'

interface WizardContextType {
  profileId: string
  step: WizardStep
  setStep: (step: WizardStep) => void
  profile: DeckProfile | null
  loading: boolean

  // Step 1: Setup State
  profileName: string
  setProfileName: (name: string) => void
  mdbListKey: string
  setMdbListKey: (key: string) => void
  scrobbleMdbList: boolean
  setScrobbleMdbList: (val: boolean) => void
  tmdbToken: string
  setTmdbToken: (token: string) => void
  letterboxd: string
  setLetterboxd: (val: string) => void
  showLetterboxd: boolean
  setShowLetterboxd: (val: boolean | ((p: boolean) => boolean)) => void
  letterboxdVerified: boolean
  setLetterboxdVerified: (val: boolean) => void
  handleVerifyLetterboxd: () => void

  // Trackers & Connections
  traktConnected: boolean
  setTraktConnected: (val: boolean) => void
  traktUsername: string
  setTraktUsername: (val: string) => void
  scrobbleTrakt: boolean
  setScrobbleTrakt: (val: boolean) => void

  simklConnected: boolean
  setSimklConnected: (val: boolean) => void
  simklUsername: string
  setSimklUsername: (val: string) => void
  scrobbleSimkl: boolean
  setScrobbleSimkl: (val: boolean) => void

  anilistConnected: boolean
  setAnilistConnected: (val: boolean) => void
  anilistUsername: string
  setAnilistUsername: (val: string) => void
  scrobbleAniList: boolean
  setScrobbleAniList: (val: boolean) => void

  malConnected: boolean
  setMalConnected: (val: boolean) => void
  malUsername: string
  setMalUsername: (val: string) => void
  scrobbleMal: boolean
  setScrobbleMal: (val: boolean) => void

  tmdbAccountConnected: boolean
  setTmdbAccountConnected: (val: boolean) => void
  tmdbAccountUsername: string
  setTmdbAccountUsername: (val: string) => void

  playbackEndRule: 'watched' | 'finished'
  setPlaybackEndRule: (val: 'watched' | 'finished') => void
  step1Submitted: boolean
  setStep1Submitted: (val: boolean) => void

  // Validation
  isMdbListValid: boolean
  isTmdbValid: boolean
  isStep1Valid: boolean
  setupPercent: number

  // Connect Dialog & Info Sheets
  connectModalProvider: ConnectProviderType | null
  setConnectModalProvider: (provider: ConnectProviderType | null) => void
  connectModalUsername: string
  setConnectModalUsername: (username: string) => void
  openConnectDialog: (provider: ConnectProviderType) => void
  handleConfirmConnect: () => void
  handleDisconnect: (provider: ConnectProviderType) => void
  activeInfoKey: string | null
  setActiveInfoKey: (key: string | null) => void

  // AI & Search & Discover
  aiProvider: 'Google Gemini' | 'Groq'
  setAiProvider: (val: 'Google Gemini' | 'Groq') => void
  aiModel: string
  setAiModel: (val: string) => void
  aiApiKey: string
  setAiApiKey: (val: string) => void
  groqApiKey: string
  setGroqApiKey: (val: string) => void
  aiPoweredSearch: boolean
  setAiPoweredSearch: (val: boolean) => void
  searchEnabled: boolean
  setSearchEnabled: (val: boolean) => void
  searchIncludeXp: boolean
  setSearchIncludeXp: (val: boolean) => void
  searchAnimeRows: boolean
  setSearchAnimeRows: (val: boolean) => void
  searchAiSuggestions: boolean
  setSearchAiSuggestions: (val: boolean) => void
  searchFranchiseCollections: boolean
  setSearchFranchiseCollections: (val: boolean) => void
  searchMainRowsName: string
  setSearchMainRowsName: (val: string) => void
  searchAnimeRowsName: string
  setSearchAnimeRowsName: (val: string) => void
  discoverEnabled: boolean
  setDiscoverEnabled: (val: boolean) => void
  discoverMoviesName: string
  setDiscoverMoviesName: (val: string) => void
  discoverSeriesName: string
  setDiscoverSeriesName: (val: string) => void

  // Posters & Preferences
  posterProviders: PosterProvider[]
  setPosterProviders: React.Dispatch<React.SetStateAction<PosterProvider[]>>
  showRatingsOnPosters: boolean
  setShowRatingsOnPosters: (val: boolean) => void
  ratingBadgedStills: boolean
  setRatingBadgedStills: (val: boolean) => void
  hideAdult: boolean
  setHideAdult: (val: boolean) => void
  excludeUnreleased: boolean
  setExcludeUnreleased: (val: boolean) => void
  moviesDigitalOnly: boolean
  setMoviesDigitalOnly: (val: boolean) => void
  hideWatched: boolean
  setHideWatched: (val: boolean) => void
  hideCaughtUp: boolean
  setHideCaughtUp: (val: boolean) => void
  language: string
  setLanguage: (val: string) => void
  ageRating: string
  setAgeRating: (val: string) => void
  selectedRegion: string
  setSelectedRegion: (val: string) => void
  proxyUrl: string
  setProxyUrl: (val: string) => void
  excludedGenres: string[]
  setExcludedGenres: React.Dispatch<React.SetStateAction<string[]>>
  animeEpisodeOrdering: string
  setAnimeEpisodeOrdering: (val: string) => void
  animeSource: string
  setAnimeSource: (val: string) => void
  animeNumbering: string
  setAnimeNumbering: (val: string) => void
  fillerEpisodes: string
  setFillerEpisodes: (val: string) => void
  animeStreamId: string
  setAnimeStreamId: (val: string) => void

  // Dynamic Catalog Registry
  activeCategories: typeof CATALOG_CATEGORIES
  activePresets: typeof XPERIENCE_PRESETS

  // Custom Row
  customRowInput: string
  setCustomRowInput: (val: string) => void
  customRowType: 'movie' | 'series'
  setCustomRowType: (val: 'movie' | 'series') => void
  customRowPrefix: 'mdblist' | 'tmdb_actor' | 'tmdb_director' | 'tmdb_company'
  setCustomRowPrefix: (val: 'mdblist' | 'tmdb_actor' | 'tmdb_director' | 'tmdb_company') => void
  handleAddCustomRow: () => void

  // Accordion sections in Setup
  openSection: string | null
  setOpenSection: (val: string | null) => void

  // Step 2: Home rows State
  catalogSearch: string
  setCatalogSearch: (val: string) => void
  expandedCategories: string[]
  setExpandedCategories: React.Dispatch<React.SetStateAction<string[]>>
  toggleCategory: (catId: string) => void
  toggleAllCategories: () => void
  handleSelectAllCategory: (catId: string) => void
  handleClearCategory: (catId: string) => void
  selectedRows: CatalogItem[]
  setSelectedRows: React.Dispatch<React.SetStateAction<CatalogItem[]>>
  toggleRow: (item: CatalogItem) => void

  // Dialogs & Filters
  arrangeHomeOpen: boolean
  setArrangeHomeOpen: (val: boolean) => void
  editingRow: CatalogItem | null
  setEditingRow: (row: CatalogItem | null) => void
  rowFilters: Record<string, RowFilterConfig>
  setRowFilters: React.Dispatch<React.SetStateAction<Record<string, RowFilterConfig>>>
  getFilterCount: (rowId: string) => number
  tempFilters: {
    customTitle: string
    minRating: number
    minVotes: number
    yearFrom: number
    yearTo: number
    sortBy: string
  }
  setTempFilters: React.Dispatch<
    React.SetStateAction<{
      customTitle: string
      minRating: number
      minVotes: number
      yearFrom: number
      yearTo: number
      sortBy: string
    }>
  >
  aiPromptOpen: boolean
  setAiPromptOpen: (val: boolean) => void
  aiPromptInput: string
  setAiPromptInput: (val: string) => void
  handleCreateAiRow: () => void
  customListOpen: boolean
  setCustomListOpen: (val: boolean) => void

  // Step 3: Collections
  collections: CollectionConfig[]
  setCollections: React.Dispatch<React.SetStateAction<CollectionConfig[]>>

  // Step 4: Streams
  streamsEnabled: boolean
  setStreamsEnabled: (val: boolean) => void
  selectedDebridProvider: DebridProviderType
  setSelectedDebridProvider: (val: DebridProviderType) => void
  debridApiKey: string
  setDebridApiKey: (val: string) => void
  showDebridKey: boolean
  setShowDebridKey: (val: boolean | ((p: boolean) => boolean)) => void
  debridVerified: boolean
  setDebridVerified: (val: boolean) => void
  streamSources: StreamSourceConfig[]
  setStreamSources: React.Dispatch<React.SetStateAction<StreamSourceConfig[]>>
  formatterPreset: StreamFormatterPreset
  setFormatterPreset: (val: StreamFormatterPreset) => void
  cachedOnly: boolean
  setCachedOnly: (val: boolean) => void
  excludePreDigital: boolean
  setExcludePreDigital: (val: boolean) => void
  maxPerResolution: number
  setMaxPerResolution: (val: number) => void
  enabledResolutions: string[]
  setEnabledResolutions: React.Dispatch<React.SetStateAction<string[]>>
  streamProxyEnabled: boolean
  setStreamProxyEnabled: (val: boolean) => void
  streamProxyType: StreamProxyType
  setStreamProxyType: (val: StreamProxyType) => void
  streamProxyUrl: string
  setStreamProxyUrl: (val: string) => void
  streamProxyPassword: string
  setStreamProxyPassword: (val: string) => void

  // Step 5: Finalize
  sessions: any[]
  isPushing: boolean
  saveProfileConfig: () => Promise<void>
  handlePushToNuvio: () => Promise<void>

  // Live preview
  previewOpen: boolean
  setPreviewOpen: (val: boolean) => void
  previewMetas: Record<string, any[]>
}

const WizardContext = React.createContext<WizardContextType | null>(null)

export function useWizard() {
  const ctx = React.useContext(WizardContext)
  if (!ctx) {
    throw new Error('useWizard must be used within a WizardProvider')
  }
  return ctx
}

export function WizardProvider({
  profileId,
  children,
}: {
  profileId: string
  children: React.ReactNode
}) {
  const [step, setStep] = React.useState<WizardStep>(1)
  const [profile, setProfile] = React.useState<DeckProfile | null>(null)
  const [loading, setLoading] = React.useState(true)

  // Step 1: Setup State
  const [profileName, setProfileName] = React.useState('')
  const [mdbListKey, setMdbListKey] = React.useState('')
  const [scrobbleMdbList, setScrobbleMdbList] = React.useState(true)
  const [tmdbToken, setTmdbToken] = React.useState('')
  const [letterboxd, setLetterboxd] = React.useState('')
  const [showLetterboxd, setShowLetterboxd] = React.useState(false)
  const [letterboxdVerified, setLetterboxdVerified] = React.useState(false)

  // Trackers & Connections
  const [traktConnected, setTraktConnected] = React.useState(false)
  const [traktUsername, setTraktUsername] = React.useState('')
  const [scrobbleTrakt, setScrobbleTrakt] = React.useState(false)

  const [simklConnected, setSimklConnected] = React.useState(false)
  const [simklUsername, setSimklUsername] = React.useState('')
  const [scrobbleSimkl, setScrobbleSimkl] = React.useState(false)

  const [anilistConnected, setAnilistConnected] = React.useState(false)
  const [anilistUsername, setAnilistUsername] = React.useState('')
  const [scrobbleAniList, setScrobbleAniList] = React.useState(false)

  const [malConnected, setMalConnected] = React.useState(false)
  const [malUsername, setMalUsername] = React.useState('')
  const [scrobbleMal, setScrobbleMal] = React.useState(false)

  const [tmdbAccountConnected, setTmdbAccountConnected] = React.useState(false)
  const [tmdbAccountUsername, setTmdbAccountUsername] = React.useState('')

  const [playbackEndRule, setPlaybackEndRule] = React.useState<'watched' | 'finished'>('finished')
  const [step1Submitted, setStep1Submitted] = React.useState(false)

  // Connect Dialog & Info Sheets
  const [connectModalProvider, setConnectModalProvider] =
    React.useState<ConnectProviderType | null>(null)
  const [connectModalUsername, setConnectModalUsername] = React.useState('')
  const [activeInfoKey, setActiveInfoKey] = React.useState<string | null>(null)

  // Validation
  const isMdbListValid = Boolean(mdbListKey.trim())
  const isTmdbValid = Boolean(tmdbToken.trim())
  const isStep1Valid = isMdbListValid && isTmdbValid
  const setupPercent = Math.round(
    ((Number(isMdbListValid) + Number(isTmdbValid)) / 2) * 50 + ((step - 1) / 4) * 50
  )

  // AI & Search & Discover
  const [aiProvider, setAiProvider] = React.useState<'Google Gemini' | 'Groq'>('Google Gemini')
  const [aiModel, setAiModel] = React.useState('gemini-3.5-flash-lite')
  const [aiApiKey, setAiApiKey] = React.useState('')
  const [groqApiKey, setGroqApiKey] = React.useState('')
  const [aiPoweredSearch, setAiPoweredSearch] = React.useState(true)
  const [searchEnabled, setSearchEnabled] = React.useState(true)
  const [searchIncludeXp, setSearchIncludeXp] = React.useState(true)
  const [searchAnimeRows, setSearchAnimeRows] = React.useState(true)
  const [searchAiSuggestions, setSearchAiSuggestions] = React.useState(true)
  const [searchFranchiseCollections, setSearchFranchiseCollections] = React.useState(true)
  const [searchMainRowsName, setSearchMainRowsName] = React.useState('')
  const [searchAnimeRowsName, setSearchAnimeRowsName] = React.useState('')
  const [discoverEnabled, setDiscoverEnabled] = React.useState(true)
  const [discoverMoviesName, setDiscoverMoviesName] = React.useState('')
  const [discoverSeriesName, setDiscoverSeriesName] = React.useState('')

  // Posters & Preferences
  const [posterProviders, setPosterProviders] =
    React.useState<PosterProvider[]>(INITIAL_POSTER_PROVIDERS)
  const [showRatingsOnPosters, setShowRatingsOnPosters] = React.useState(true)
  const [ratingBadgedStills, setRatingBadgedStills] = React.useState(true)
  const [hideAdult, setHideAdult] = React.useState(true)
  const [excludeUnreleased, setExcludeUnreleased] = React.useState(true)
  const [moviesDigitalOnly, setMoviesDigitalOnly] = React.useState(false)
  const [hideWatched, setHideWatched] = React.useState(false)
  const [hideCaughtUp, setHideCaughtUp] = React.useState(false)
  const [language, setLanguage] = React.useState('en-US')
  const [ageRating, setAgeRating] = React.useState('NONE')
  const [selectedRegion, setSelectedRegion] = React.useState('United States')
  const [proxyUrl, setProxyUrl] = React.useState('')
  const [excludedGenres, setExcludedGenres] = React.useState<string[]>([])
  const [animeEpisodeOrdering, setAnimeEpisodeOrdering] = React.useState('TheTVDB')
  const [animeSource, setAnimeSource] = React.useState('TheTVDB')
  const [animeNumbering, setAnimeNumbering] = React.useState('Absolute (1137)')
  const [fillerEpisodes, setFillerEpisodes] = React.useState('Tag ([Filler])')
  const [animeStreamId, setAnimeStreamId] = React.useState('IMDb')

  // Dynamic Catalog Registry (Server Single Source of Truth)
  const { data: registryData } = useCatalogRegistry()
  const activeCategories = registryData?.categories || CATALOG_CATEGORIES
  const activePresets = registryData?.presets || XPERIENCE_PRESETS

  // Dynamic Custom Row state
  const [customRowInput, setCustomRowInput] = React.useState('')
  const [customRowType, setCustomRowType] = React.useState<'movie' | 'series'>('movie')
  const [customRowPrefix, setCustomRowPrefix] = React.useState<
    'mdblist' | 'tmdb_actor' | 'tmdb_director' | 'tmdb_company'
  >('mdblist')

  const handleAddCustomRow = () => {
    if (!customRowInput.trim()) return
    let cleanVal = customRowInput.trim()
    if (cleanVal.includes('mdblist.com/lists/')) {
      cleanVal = cleanVal.split('mdblist.com/lists/')[1].replace(/\/+$/, '')
    }
    const id = `${customRowPrefix}:${cleanVal}`
    const prefixName = customRowPrefix.replace('tmdb_', '').toUpperCase()
    const label = `Custom [${prefixName}]: ${cleanVal}`

    if (selectedRows.some((r) => r.id === id)) {
      toast.error('Row already added to profile')
      return
    }
    if (selectedRows.length >= 50) {
      toast.error('Maximum 50 rows limit reached')
      return
    }

    setSelectedRows((prev) => [
      ...prev,
      {
        id,
        name: label,
        category: 'Custom Dynamic Rows',
        type: customRowType,
        source: customRowPrefix.startsWith('tmdb') ? 'tmdb' : 'mdblist',
      },
    ])
    setCustomRowInput('')
    toast.success(`Added custom row: ${label}`)
  }

  // Expanded cards in Setup
  const [openSection, setOpenSection] = React.useState<string | null>('integrations')

  // Step 2: Home rows State
  const [catalogSearch, setCatalogSearch] = React.useState('')
  const [expandedCategories, setExpandedCategories] = React.useState<string[]>([
    'for_you_trending',
    'streaming_top10',
    'streaming',
  ])
  const [selectedRows, setSelectedRows] = React.useState<CatalogItem[]>(() =>
    getPresetRows('balanced')
  )
  const [arrangeHomeOpen, setArrangeHomeOpen] = React.useState(false)
  const [editingRow, setEditingRow] = React.useState<CatalogItem | null>(null)
  const [rowFilters, setRowFilters] = React.useState<Record<string, RowFilterConfig>>({
    ai_series_for_you: { minRating: 7.0, minVotes: 500 },
    ai_movies_for_you: { minRating: 7.5, minVotes: 1000, sortBy: 'popularity' },
    recs_movies_for_you: { minRating: 7.0, minVotes: 300 },
    genre_bollywood_latest_movies: { yearFrom: 2023 },
    genre_bollywood_latest_series: { yearFrom: 2023 },
    trending_movies: { minRating: 6.5 },
    trending_series: { minRating: 6.5, minVotes: 200 },
    snoak_top100_movies: { minRating: 7.0, minVotes: 500 },
    awards_imdb_top250_movies: { minRating: 8.0 },
  })
  const [aiPromptOpen, setAiPromptOpen] = React.useState(false)
  const [aiPromptInput, setAiPromptInput] = React.useState('')
  const [customListOpen, setCustomListOpen] = React.useState(false)

  const getFilterCount = (rowId: string) => {
    const f = rowFilters[rowId]
    if (!f) return 0
    let count = 0
    if (f.customTitle && f.customTitle.trim().length > 0) count++
    if (f.minRating !== undefined && f.minRating > 0) count++
    if (f.minVotes !== undefined && f.minVotes > 0) count++
    if (f.yearFrom !== undefined && f.yearFrom > 1900) count++
    if (f.yearTo !== undefined && f.yearTo < 2026) count++
    if (f.sortBy && f.sortBy !== 'default') count++
    return count
  }

  const [tempFilters, setTempFilters] = React.useState<{
    customTitle: string
    minRating: number
    minVotes: number
    yearFrom: number
    yearTo: number
    sortBy: string
  }>({
    customTitle: '',
    minRating: 0,
    minVotes: 0,
    yearFrom: 1900,
    yearTo: 2026,
    sortBy: 'default',
  })

  React.useEffect(() => {
    if (editingRow) {
      const existing = rowFilters[editingRow.id] || {}
      setTempFilters({
        customTitle: existing.customTitle || '',
        minRating: existing.minRating || 0,
        minVotes: existing.minVotes || 0,
        yearFrom: existing.yearFrom || 1900,
        yearTo: existing.yearTo || 2026,
        sortBy: existing.sortBy || 'default',
      })
    }
  }, [editingRow, rowFilters])

  const toggleAllCategories = () => {
    if (expandedCategories.length > 0) {
      setExpandedCategories([])
    } else {
      setExpandedCategories(activeCategories.map((c) => c.id))
    }
  }

  const handleSelectAllCategory = (catId: string) => {
    const cat = activeCategories.find((c) => c.id === catId)
    if (!cat) return
    const itemsToAdd = cat.items.filter((item) => !selectedRows.some((r) => r.id === item.id))
    if (itemsToAdd.length > 0) {
      setSelectedRows((prev) => [...prev, ...itemsToAdd])
      toast.success(`Added ${itemsToAdd.length} rows from ${cat.name}`)
    }
  }

  const handleClearCategory = (catId: string) => {
    const cat = activeCategories.find((c) => c.id === catId)
    if (!cat) return
    const catItemIds = new Set(cat.items.map((i) => i.id))
    setSelectedRows((prev) => prev.filter((r) => !catItemIds.has(r.id)))
    toast.info(`Removed ${cat.name} rows`)
  }

  const handleCreateAiRow = () => {
    if (!aiPromptInput.trim()) return
    const id = `ai_prompt_${Date.now()}`
    const newRow: CatalogItem = {
      id,
      name: aiPromptInput.trim(),
      category: 'AI generated',
      type: 'both',
      isAi: true,
      personalized: true,
    }
    setSelectedRows((prev) => [newRow, ...prev])
    setRowFilters((prev) => ({
      ...prev,
      [id]: { customTitle: aiPromptInput.trim() },
    }))
    setAiPromptInput('')
    setAiPromptOpen(false)
    toast.success(`Generated AI Catalog row: "${newRow.name}"`)
  }

  // Step 3: Collections State
  const [collections, setCollections] = React.useState<CollectionConfig[]>(DEFAULT_COLLECTIONS)

  // Step 4: Streams Configuration State
  const [streamsEnabled, setStreamsEnabled] = React.useState(true)
  const [selectedDebridProvider, setSelectedDebridProvider] =
    React.useState<DebridProviderType>('realdebrid')
  const [debridApiKey, setDebridApiKey] = React.useState('')
  const [showDebridKey, setShowDebridKey] = React.useState(false)
  const [debridVerified, setDebridVerified] = React.useState(false)

  const [streamSources, setStreamSources] = React.useState<StreamSourceConfig[]>([
    {
      id: 'torrentio',
      name: 'Torrentio',
      type: 'torrentio',
      url: 'https://torrentio.strem.fun',
      enabled: true,
      description: 'Scrapes torrent providers with instant debrid caching support.',
    },
    {
      id: 'comet',
      name: 'Comet',
      type: 'comet',
      url: 'https://comet.elfhosted.com',
      enabled: true,
      description: 'Ultra-fast P2P & debrid scraper with smart ranking and duplicate filtering.',
    },
    {
      id: 'mediafusion',
      name: 'MediaFusion',
      type: 'mediafusion',
      url: 'https://mediafusion.elfhosted.com',
      enabled: false,
      description: 'Multi-source stream provider supporting international and live content.',
    },
    {
      id: 'stremthru',
      name: 'StremThru',
      type: 'stremthru',
      url: 'https://stremthru.elfhosted.com',
      enabled: false,
      description: 'Next-generation modular streaming router & proxy aggregator.',
    },
  ])

  const [formatterPreset, setFormatterPreset] = React.useState<StreamFormatterPreset>('nuvio')

  const [cachedOnly, setCachedOnly] = React.useState(true)
  const [excludePreDigital, setExcludePreDigital] = React.useState(true)
  const [maxPerResolution, setMaxPerResolution] = React.useState<number>(10)
  const [enabledResolutions, setEnabledResolutions] = React.useState<string[]>([
    '2160p',
    '1080p',
    '720p',
  ])

  const [streamProxyEnabled, setStreamProxyEnabled] = React.useState(false)
  const [streamProxyType, setStreamProxyType] = React.useState<StreamProxyType>('mediaflow')
  const [streamProxyUrl, setStreamProxyUrl] = React.useState('')
  const [streamProxyPassword, setStreamProxyPassword] = React.useState('')

  // Step 5: Finalize State
  const [sessions, setSessions] = React.useState<any[]>([])
  const [isPushing, setIsPushing] = React.useState(false)

  // Live preview modal
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [previewMetas, setPreviewMetas] = React.useState<Record<string, any[]>>({})

  // Fetch real catalog preview items when Live Preview is opened
  React.useEffect(() => {
    if (!previewOpen) return
    const previewRows = selectedRows.slice(0, 4)
    previewRows.forEach(async (row) => {
      try {
        const cleanType = row.type === 'both' || !row.type ? 'movie' : row.type
        const res = await fetch(
          `http://localhost:3001/api/catalogs/${profileId}/catalog/${cleanType}/${row.id}.json`
        )
        if (res.ok) {
          const data = await res.json()
          if (data.metas && data.metas.length > 0) {
            setPreviewMetas((prev) => ({ ...prev, [row.id]: data.metas }))
          }
        }
      } catch {
        // ignore preview fetch errors
      }
    })
  }, [previewOpen, profileId, selectedRows])

  // Load profile data
  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const res = await nuvioApi.getDeckProfiles()
        const found = res.profiles?.find((p) => p.id === profileId)
        if (found) {
          setProfile(found)
          setProfileName(found.name)
          if (found.configJson) {
            try {
              const cfg = JSON.parse(found.configJson)
              if (cfg.rows && Array.isArray(cfg.rows) && cfg.rows.length > 0)
                setSelectedRows(cfg.rows)
              else if (
                cfg.selectedRows &&
                Array.isArray(cfg.selectedRows) &&
                cfg.selectedRows.length > 0
              )
                setSelectedRows(cfg.selectedRows)
              else if (cfg.initialPresetId) setSelectedRows(getPresetRows(cfg.initialPresetId))
              if (cfg.collections) setCollections(cfg.collections)
              if (cfg.preferences) {
                if (cfg.preferences.language) setLanguage(cfg.preferences.language)
                if (cfg.preferences.ageRating) setAgeRating(cfg.preferences.ageRating)
                if (cfg.preferences.region) setSelectedRegion(cfg.preferences.region)
                if (cfg.preferences.proxyUrl) setProxyUrl(cfg.preferences.proxyUrl)
                if (cfg.preferences.excludeUnreleased !== undefined)
                  setExcludeUnreleased(cfg.preferences.excludeUnreleased)
                if (cfg.preferences.moviesDigitalOnly !== undefined)
                  setMoviesDigitalOnly(cfg.preferences.moviesDigitalOnly)
                if (cfg.preferences.hideAdult !== undefined) setHideAdult(cfg.preferences.hideAdult)
              }
              if (cfg.posters) {
                if (cfg.posters.providers && Array.isArray(cfg.posters.providers))
                  setPosterProviders(cfg.posters.providers)
                if (cfg.posters.showRatingsOnPosters !== undefined)
                  setShowRatingsOnPosters(cfg.posters.showRatingsOnPosters)
                if (cfg.posters.ratingBadgedStills !== undefined)
                  setRatingBadgedStills(cfg.posters.ratingBadgedStills)
              }
              if (cfg.streams) {
                if (cfg.streams.enabled !== undefined) setStreamsEnabled(cfg.streams.enabled)
                if (cfg.streams.debridProvider)
                  setSelectedDebridProvider(cfg.streams.debridProvider)
                if (cfg.streams.debridApiKey) setDebridApiKey(cfg.streams.debridApiKey)
                if (cfg.streams.sources && Array.isArray(cfg.streams.sources))
                  setStreamSources(cfg.streams.sources)
                if (cfg.streams.formatter?.preset)
                  setFormatterPreset(cfg.streams.formatter.preset)
                if (cfg.streams.filters) {
                  if (cfg.streams.filters.cachedOnly !== undefined)
                    setCachedOnly(cfg.streams.filters.cachedOnly)
                  if (cfg.streams.filters.excludePreDigital !== undefined)
                    setExcludePreDigital(cfg.streams.filters.excludePreDigital)
                  if (cfg.streams.filters.maxPerResolution !== undefined)
                    setMaxPerResolution(cfg.streams.filters.maxPerResolution)
                  if (cfg.streams.filters.enabledResolutions)
                    setEnabledResolutions(cfg.streams.filters.enabledResolutions)
                }
                if (cfg.streams.proxy) {
                  if (cfg.streams.proxy.enabled !== undefined)
                    setStreamProxyEnabled(cfg.streams.proxy.enabled)
                  if (cfg.streams.proxy.type) setStreamProxyType(cfg.streams.proxy.type)
                  if (cfg.streams.proxy.url) setStreamProxyUrl(cfg.streams.proxy.url)
                  if (cfg.streams.proxy.apiPassword)
                    setStreamProxyPassword(cfg.streams.proxy.apiPassword)
                }
              }
              if (cfg.integrations) {
                if (cfg.integrations.mdbListKey !== undefined)
                  setMdbListKey(cfg.integrations.mdbListKey)
                if (cfg.integrations.tmdbToken !== undefined)
                  setTmdbToken(cfg.integrations.tmdbToken)
                if (cfg.integrations.proxyUrl !== undefined) setProxyUrl(cfg.integrations.proxyUrl)
                if (cfg.integrations.scrobbleMdbList !== undefined)
                  setScrobbleMdbList(cfg.integrations.scrobbleMdbList)
                if (cfg.integrations.letterboxd !== undefined)
                  setLetterboxd(cfg.integrations.letterboxd)
                if (cfg.integrations.playbackEndRule !== undefined)
                  setPlaybackEndRule(cfg.integrations.playbackEndRule)
                if (cfg.integrations.trakt) {
                  setTraktConnected(Boolean(cfg.integrations.trakt.connected))
                  setTraktUsername(cfg.integrations.trakt.username || '')
                }
                if (cfg.integrations.scrobbleTrakt !== undefined)
                  setScrobbleTrakt(cfg.integrations.scrobbleTrakt)
                if (cfg.integrations.simkl) {
                  setSimklConnected(Boolean(cfg.integrations.simkl.connected))
                  setSimklUsername(cfg.integrations.simkl.username || '')
                }
                if (cfg.integrations.scrobbleSimkl !== undefined)
                  setScrobbleSimkl(cfg.integrations.scrobbleSimkl)
                if (cfg.integrations.anilist) {
                  setAnilistConnected(Boolean(cfg.integrations.anilist.connected))
                  setAnilistUsername(cfg.integrations.anilist.username || '')
                }
                if (cfg.integrations.scrobbleAniList !== undefined)
                  setScrobbleAniList(cfg.integrations.scrobbleAniList)
                if (cfg.integrations.myanimelist) {
                  setMalConnected(Boolean(cfg.integrations.myanimelist.connected))
                  setMalUsername(cfg.integrations.myanimelist.username || '')
                }
                if (cfg.integrations.scrobbleMal !== undefined)
                  setScrobbleMal(cfg.integrations.scrobbleMal)
                if (cfg.integrations.tmdbAccount) {
                  setTmdbAccountConnected(Boolean(cfg.integrations.tmdbAccount.connected))
                  setTmdbAccountUsername(cfg.integrations.tmdbAccount.username || '')
                }
              } else {
                // Brand new profile: inherit global defaults cleanly from Settings Store
                const settings = useSettingsStore.getState()
                if (settings.apiKeys.mdblist) setMdbListKey(settings.apiKeys.mdblist)
                if (settings.apiKeys.tmdb) setTmdbToken(settings.apiKeys.tmdb)
                if (settings.apiKeys.letterboxd) setLetterboxd(settings.apiKeys.letterboxd)
                if (settings.apiKeys.mdblistScrobble !== undefined)
                  setScrobbleMdbList(settings.apiKeys.mdblistScrobble)
                if (settings.playbackCompletion) {
                  setPlaybackEndRule(
                    settings.playbackCompletion === 'auto' ? 'watched' : 'finished'
                  )
                }
                if (settings.connections.trakt.connected) {
                  setTraktConnected(true)
                  setTraktUsername(settings.connections.trakt.username)
                  setScrobbleTrakt(settings.connections.trakt.scrobble)
                }
                if (settings.connections.simkl.connected) {
                  setSimklConnected(true)
                  setSimklUsername(settings.connections.simkl.username)
                }
                if (settings.connections.anilist.connected) {
                  setAnilistConnected(true)
                  setAnilistUsername(settings.connections.anilist.username)
                }
                if (settings.connections.myanimelist.connected) {
                  setMalConnected(true)
                  setMalUsername(settings.connections.myanimelist.username)
                }
                if (settings.connections.tmdb.connected) {
                  setTmdbAccountConnected(true)
                  setTmdbAccountUsername(settings.connections.tmdb.username)
                }
              }
              if (cfg.integrations?.proxyUrl && !cfg.preferences?.proxyUrl) {
                setProxyUrl(cfg.integrations.proxyUrl)
              }
            } catch {
              // ignore json error
            }
          }
        } else {
          setProfileName('Custom Profile')
        }

        const sessRes = await nuvioApi.getConnectedSessions().catch(() => ({ sessions: [] }))
        if (sessRes.sessions) setSessions(sessRes.sessions)
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [profileId])

  // Toggle row selection
  const toggleRow = (item: CatalogItem) => {
    if (selectedRows.some((r) => r.id === item.id)) {
      setSelectedRows((prev) => prev.filter((r) => r.id !== item.id))
    } else {
      if (selectedRows.length >= 50) {
        toast.error('Maximum 50 rows limit reached')
        return
      }
      setSelectedRows((prev) => [...prev, item])
    }
  }

  // Save profile state to backend
  const saveProfileConfig = async () => {
    if (!profile) return
    try {
      const configJson = {
        name: profileName,
        rows: selectedRows,
        collections,
        integrations: {
          mdbListKey,
          scrobbleMdbList,
          tmdbToken,
          proxyUrl,
          letterboxd,
          scrobbleTrakt,
          scrobbleSimkl,
          scrobbleAniList,
          scrobbleMal,
          trakt: { connected: traktConnected, username: traktUsername },
          simkl: { connected: simklConnected, username: simklUsername },
          anilist: { connected: anilistConnected, username: anilistUsername },
          myanimelist: { connected: malConnected, username: malUsername },
          tmdbAccount: { connected: tmdbAccountConnected, username: tmdbAccountUsername },
          playbackEndRule,
        },
        ai: {
          provider: aiProvider === 'Groq' ? 'groq' : 'gemini',
          apiKey: aiProvider === 'Groq' ? groqApiKey : aiApiKey,
          geminiApiKey: aiApiKey,
          groqApiKey,
          model: aiModel,
          aiPoweredSearch,
        },
        search: {
          enabled: searchEnabled,
          includeXp: searchIncludeXp,
          animeRows: searchAnimeRows,
          aiSuggestions: searchAiSuggestions,
          franchiseCollections: searchFranchiseCollections,
          mainRowsName: searchMainRowsName,
          animeRowsName: searchAnimeRowsName,
        },
        discover: {
          enabled: discoverEnabled,
          moviesName: discoverMoviesName,
          seriesName: discoverSeriesName,
        },
        posters: {
          providers: posterProviders,
          showRatingsOnPosters,
          ratingBadgedStills,
        },
        streams: {
          enabled: streamsEnabled,
          debridProvider: selectedDebridProvider,
          debridApiKey,
          sources: streamSources,
          formatter: {
            preset: formatterPreset,
          },
          filters: {
            cachedOnly,
            excludePreDigital,
            maxPerResolution,
            enabledResolutions,
          },
          proxy: {
            enabled: streamProxyEnabled,
            type: streamProxyType,
            url: streamProxyUrl,
            apiPassword: streamProxyPassword,
          },
        },
        preferences: {
          language,
          ageRating,
          region: selectedRegion,
          proxyUrl,
          hideAdult,
          excludeUnreleased,
          moviesDigitalOnly,
          hideWatched,
          hideCaughtUp,
          excludedGenres,
          animeEpisodeOrdering,
          animeSource,
          animeNumbering,
          fillerEpisodes,
          animeStreamId,
        },
      }

      await nuvioApi.updateDeckProfile(profile.id, {
        name: profileName,
        rowCount: selectedRows.length,
        collectionCount: collections.length,
        configJson: JSON.stringify(configJson),
      })
    } catch (err: any) {
      console.error('Failed to save profile config:', err)
    }
  }

  // Push to Nuvio cloud action
  const handlePushToNuvio = async () => {
    if (!profile) return
    try {
      setIsPushing(true)
      await saveProfileConfig()
      const targetSession = sessions[0]
      if (!targetSession) {
        toast.error(
          'No connected Nuvio account found. Please sign in via the sidebar account switcher.'
        )
        return
      }

      const res = await nuvioApi.deployDeckProfile(profile.id, {
        targets: [{ accountId: targetSession.id, slots: [1] }],
        options: {
          pushBadges: true,
          pushAvatar: true,
          pushCollections: true,
          pushAddons: true,
        },
      })

      if (res.success) {
        toast.success(`Successfully pushed "${profileName}" to Nuvio!`)
      }
    } catch (err: any) {
      toast.error(err.message || 'Push to Nuvio failed')
    } finally {
      setIsPushing(false)
    }
  }

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    )
  }

  const handleVerifyLetterboxd = () => {
    if (!letterboxd.trim()) {
      toast.error('Please enter a Letterboxd username')
      return
    }
    setLetterboxdVerified(true)
    toast.success(`Letterboxd user "${letterboxd.trim()}" verified`)
  }

  const openConnectDialog = (provider: ConnectProviderType) => {
    setConnectModalProvider(provider)
    setConnectModalUsername('')
  }

  const handleConfirmConnect = () => {
    if (!connectModalUsername.trim()) {
      toast.error('Please enter an account username')
      return
    }
    const username = connectModalUsername.trim()
    if (connectModalProvider === 'trakt') {
      setTraktConnected(true)
      setTraktUsername(username)
      setScrobbleTrakt(true)
      useSettingsStore
        .getState()
        .setConnection('trakt', { connected: true, username, scrobble: true })
      toast.success(`Connected Trakt as ${username}`)
    } else if (connectModalProvider === 'simkl') {
      setSimklConnected(true)
      setSimklUsername(username)
      useSettingsStore.getState().setConnection('simkl', { connected: true, username })
      toast.success(`Connected Simkl as ${username}`)
    } else if (connectModalProvider === 'anilist') {
      setAnilistConnected(true)
      setAnilistUsername(username)
      useSettingsStore.getState().setConnection('anilist', { connected: true, username })
      toast.success(`Connected AniList as ${username}`)
    } else if (connectModalProvider === 'myanimelist') {
      setMalConnected(true)
      setMalUsername(username)
      useSettingsStore.getState().setConnection('myanimelist', { connected: true, username })
      toast.success(`Connected MyAnimeList as ${username}`)
    } else if (connectModalProvider === 'tmdb') {
      setTmdbAccountConnected(true)
      setTmdbAccountUsername(username)
      useSettingsStore.getState().setConnection('tmdb', { connected: true, username })
      toast.success(`Connected TMDB account as ${username}`)
    }
    setConnectModalProvider(null)
  }

  const handleDisconnect = (provider: ConnectProviderType) => {
    if (provider === 'trakt') {
      setTraktConnected(false)
      setTraktUsername('')
      setScrobbleTrakt(false)
      useSettingsStore
        .getState()
        .setConnection('trakt', { connected: false, username: '', scrobble: false })
      toast.info('Trakt disconnected')
    } else if (provider === 'simkl') {
      setSimklConnected(false)
      setSimklUsername('')
      useSettingsStore.getState().setConnection('simkl', { connected: false, username: '' })
      toast.info('Simkl disconnected')
    } else if (provider === 'anilist') {
      setAnilistConnected(false)
      setAnilistUsername('')
      useSettingsStore.getState().setConnection('anilist', { connected: false, username: '' })
      toast.info('AniList disconnected')
    } else if (provider === 'myanimelist') {
      setMalConnected(false)
      setMalUsername('')
      useSettingsStore.getState().setConnection('myanimelist', { connected: false, username: '' })
      toast.info('MyAnimeList disconnected')
    } else if (provider === 'tmdb') {
      setTmdbAccountConnected(false)
      setTmdbAccountUsername('')
      useSettingsStore.getState().setConnection('tmdb', { connected: false, username: '' })
      toast.info('TMDB account disconnected')
    }
  }

  const value: WizardContextType = {
    profileId,
    step,
    setStep,
    profile,
    loading,
    profileName,
    setProfileName,
    mdbListKey,
    setMdbListKey,
    scrobbleMdbList,
    setScrobbleMdbList,
    tmdbToken,
    setTmdbToken,
    letterboxd,
    setLetterboxd,
    showLetterboxd,
    setShowLetterboxd,
    letterboxdVerified,
    setLetterboxdVerified,
    handleVerifyLetterboxd,
    traktConnected,
    setTraktConnected,
    traktUsername,
    setTraktUsername,
    scrobbleTrakt,
    setScrobbleTrakt,
    simklConnected,
    setSimklConnected,
    simklUsername,
    setSimklUsername,
    scrobbleSimkl,
    setScrobbleSimkl,
    anilistConnected,
    setAnilistConnected,
    anilistUsername,
    setAnilistUsername,
    scrobbleAniList,
    setScrobbleAniList,
    malConnected,
    setMalConnected,
    malUsername,
    setMalUsername,
    scrobbleMal,
    setScrobbleMal,
    tmdbAccountConnected,
    setTmdbAccountConnected,
    tmdbAccountUsername,
    setTmdbAccountUsername,
    playbackEndRule,
    setPlaybackEndRule,
    step1Submitted,
    setStep1Submitted,
    isMdbListValid,
    isTmdbValid,
    isStep1Valid,
    setupPercent,
    connectModalProvider,
    setConnectModalProvider,
    connectModalUsername,
    setConnectModalUsername,
    openConnectDialog,
    handleConfirmConnect,
    handleDisconnect,
    activeInfoKey,
    setActiveInfoKey,
    aiProvider,
    setAiProvider,
    aiModel,
    setAiModel,
    aiApiKey,
    setAiApiKey,
    groqApiKey,
    setGroqApiKey,
    aiPoweredSearch,
    setAiPoweredSearch,
    searchEnabled,
    setSearchEnabled,
    searchIncludeXp,
    setSearchIncludeXp,
    searchAnimeRows,
    setSearchAnimeRows,
    searchAiSuggestions,
    setSearchAiSuggestions,
    searchFranchiseCollections,
    setSearchFranchiseCollections,
    searchMainRowsName,
    setSearchMainRowsName,
    searchAnimeRowsName,
    setSearchAnimeRowsName,
    discoverEnabled,
    setDiscoverEnabled,
    discoverMoviesName,
    setDiscoverMoviesName,
    discoverSeriesName,
    setDiscoverSeriesName,
    posterProviders,
    setPosterProviders,
    showRatingsOnPosters,
    setShowRatingsOnPosters,
    ratingBadgedStills,
    setRatingBadgedStills,
    hideAdult,
    setHideAdult,
    excludeUnreleased,
    setExcludeUnreleased,
    moviesDigitalOnly,
    setMoviesDigitalOnly,
    hideWatched,
    setHideWatched,
    hideCaughtUp,
    setHideCaughtUp,
    language,
    setLanguage,
    ageRating,
    setAgeRating,
    selectedRegion,
    setSelectedRegion,
    proxyUrl,
    setProxyUrl,
    excludedGenres,
    setExcludedGenres,
    animeEpisodeOrdering,
    setAnimeEpisodeOrdering,
    animeSource,
    setAnimeSource,
    animeNumbering,
    setAnimeNumbering,
    fillerEpisodes,
    setFillerEpisodes,
    animeStreamId,
    setAnimeStreamId,
    activeCategories,
    activePresets,
    customRowInput,
    setCustomRowInput,
    customRowType,
    setCustomRowType,
    customRowPrefix,
    setCustomRowPrefix,
    handleAddCustomRow,
    openSection,
    setOpenSection,
    catalogSearch,
    setCatalogSearch,
    expandedCategories,
    setExpandedCategories,
    toggleCategory,
    toggleAllCategories,
    handleSelectAllCategory,
    handleClearCategory,
    selectedRows,
    setSelectedRows,
    toggleRow,
    arrangeHomeOpen,
    setArrangeHomeOpen,
    editingRow,
    setEditingRow,
    rowFilters,
    setRowFilters,
    getFilterCount,
    tempFilters,
    setTempFilters,
    aiPromptOpen,
    setAiPromptOpen,
    aiPromptInput,
    setAiPromptInput,
    handleCreateAiRow,
    customListOpen,
    setCustomListOpen,
    collections,
    setCollections,
    streamsEnabled,
    setStreamsEnabled,
    selectedDebridProvider,
    setSelectedDebridProvider,
    debridApiKey,
    setDebridApiKey,
    showDebridKey,
    setShowDebridKey,
    debridVerified,
    setDebridVerified,
    streamSources,
    setStreamSources,
    formatterPreset,
    setFormatterPreset,
    cachedOnly,
    setCachedOnly,
    excludePreDigital,
    setExcludePreDigital,
    maxPerResolution,
    setMaxPerResolution,
    enabledResolutions,
    setEnabledResolutions,
    streamProxyEnabled,
    setStreamProxyEnabled,
    streamProxyType,
    setStreamProxyType,
    streamProxyUrl,
    setStreamProxyUrl,
    streamProxyPassword,
    setStreamProxyPassword,
    sessions,
    isPushing,
    saveProfileConfig,
    handlePushToNuvio,
    previewOpen,
    setPreviewOpen,
    previewMetas,
  }

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
}
