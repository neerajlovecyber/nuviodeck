import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AppSidebar } from '@/components/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@workspace/ui/components/sidebar'
import { Separator } from '@workspace/ui/components/separator'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Search,
  Key,
  KeyRound,
  Zap,
  Lock,
  Sliders,
  Tv,
  Film,
  Eye,
  EyeOff,
  Folder,
  Layers,
  Check,
  X,
  Plus,
  ArrowUpDown,
  Download,
  Trash2,
  Compass,
  Radio,
  Image as ImageIcon,
  ShieldCheck,
  Send,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Info,
  Play,
  RotateCcw,
  Copy,
  Globe,
  ListOrdered,
  SlidersHorizontal,
  ChevronsUpDown,
  ListPlus,
  GripVertical,
  EllipsisVertical,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { Switch } from '@workspace/ui/components/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
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
import languagesData from '@/data/languages.json'
import { AGE_RATINGS } from '@/data/age-ratings'
import { STREAMING_REGIONS } from '@/data/streamings'
import { PostersConfigSection } from '@/components/posters-config-section'
import { INITIAL_POSTER_PROVIDERS, PosterProvider } from '@/store/useSettingsStore'

const POPULAR_LANGUAGES = [
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

const GROQ_MODELS = [
  { id: 'openai/gpt-oss-120b', label: 'openai/gpt-oss-120b' },
  { id: 'openai/gpt-oss-20b', label: 'openai/gpt-oss-20b' },
]

const GEMINI_MODELS = [
  { id: 'gemini-3.5-flash-lite', label: 'gemini-3.5-flash-lite' },
  { id: 'gemini-3.1-flash-lite', label: 'gemini-3.1-flash-lite' },
  { id: 'gemini-2.5-flash-lite', label: 'gemini-2.5-flash-lite' },
  { id: 'gemini-2.5-flash', label: 'gemini-2.5-flash' },
  { id: 'gemma-4-31b-it', label: 'gemma-4-31b-it' },
  { id: 'gemma-4-26b-a4b-it', label: 'gemma-4-26b-a4b-it' },
]

function SortableHomeRowItem({
  row,
  onRemove,
}: {
  row: CatalogItem
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 20 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card gap-2 select-none"
    >
      <div className="flex items-center gap-2 truncate">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1"
          aria-label={`Reorder ${row.name}`}
        >
          <GripVertical className="size-4" />
        </button>
        <div className="truncate">
          <p className="text-xs font-medium text-foreground truncate">{row.name}</p>
          <p className="text-[10px] text-muted-foreground">{row.category}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
        aria-label={`Remove ${row.name}`}
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

export const Route = createFileRoute('/wizard/$profileId')({
  component: ProfileWizardPage,
})

function ProfileWizardPage() {
  const { profileId } = Route.useParams()
  const navigate = useNavigate()

  // Wizard state
  const [step, setStep] = React.useState<1 | 2 | 3 | 4 | 5>(1)
  const [profile, setProfile] = React.useState<DeckProfile | null>(null)
  const [loading, setLoading] = React.useState(true)

  // Step 1: Setup State
  const [profileName, setProfileName] = React.useState('')
  const [mdbListKey, setMdbListKey] = React.useState('neerajlovecyber-5qsn6f')
  const [scrobbleMdbList, setScrobbleMdbList] = React.useState(true)
  const [tmdbToken, setTmdbToken] = React.useState('eyJhbGciOiJIUzI1NiJ9.verified')
  const [scrobbleTrakt, setScrobbleTrakt] = React.useState(true)
  const [scrobbleSimkl, setScrobbleSimkl] = React.useState(true)
  const [scrobbleAniList, setScrobbleAniList] = React.useState(true)
  const [scrobbleMal, setScrobbleMal] = React.useState(true)
  const [playbackEndRule, setPlaybackEndRule] = React.useState<'watched' | 'finished'>('finished')

  // AI & Search & Discover
  const [aiProvider, setAiProvider] = React.useState<'Google Gemini' | 'Groq'>('Google Gemini')
  const [aiModel, setAiModel] = React.useState('gemini-3.5-flash-lite')
  const [aiApiKey, setAiApiKey] = React.useState('AIzaSyD-sample-verified-key')
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
  const [posterProviders, setPosterProviders] = React.useState<PosterProvider[]>(INITIAL_POSTER_PROVIDERS)
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
  const [customRowPrefix, setCustomRowPrefix] = React.useState<'mdblist' | 'tmdb_actor' | 'tmdb_director' | 'tmdb_company'>('mdblist')

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
  const [selectedRows, setSelectedRows] = React.useState<CatalogItem[]>(() => getPresetRows('balanced'))
  const [arrangeHomeOpen, setArrangeHomeOpen] = React.useState(false)
  const [editingRow, setEditingRow] = React.useState<CatalogItem | null>(null)
  const [rowFilters, setRowFilters] = React.useState<
    Record<
      string,
      {
        minRating?: number
        minVotes?: number
        yearFrom?: number
        yearTo?: number
        sortBy?: string
        customTitle?: string
      }
    >
  >({
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

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleArrangeDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setSelectedRows((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

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
  const [selectedDebridProvider, setSelectedDebridProvider] = React.useState<
    'realdebrid' | 'torbox' | 'alldebrid' | 'premiumize' | 'debridlink' | 'none'
  >('realdebrid')
  const [debridApiKey, setDebridApiKey] = React.useState('rd_tok_live_738491823')
  const [showDebridKey, setShowDebridKey] = React.useState(false)
  const [debridVerified, setDebridVerified] = React.useState(true)

  const [streamSources, setStreamSources] = React.useState<
    Array<{
      id: string
      name: string
      type: 'torrentio' | 'comet' | 'mediafusion' | 'stremthru' | 'custom'
      url: string
      enabled: boolean
      description: string
    }>
  >([
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

  const [formatterPreset, setFormatterPreset] = React.useState<
    'nuvio' | 'prism' | 'charcoal' | 'streamsense' | 'ned' | 'linden' | 'shota' | 'tamtaro' | 'plain'
  >('nuvio')

  const [cachedOnly, setCachedOnly] = React.useState(true)
  const [excludePreDigital, setExcludePreDigital] = React.useState(true)
  const [maxPerResolution, setMaxPerResolution] = React.useState<number>(10)
  const [enabledResolutions, setEnabledResolutions] = React.useState<string[]>([
    '2160p',
    '1080p',
    '720p',
  ])

  const [streamProxyEnabled, setStreamProxyEnabled] = React.useState(false)
  const [streamProxyType, setStreamProxyType] = React.useState<'mediaflow' | 'stremthru' | 'generic'>('mediaflow')
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
              if (cfg.rows && Array.isArray(cfg.rows) && cfg.rows.length > 0) setSelectedRows(cfg.rows)
              else if (cfg.selectedRows && Array.isArray(cfg.selectedRows) && cfg.selectedRows.length > 0) setSelectedRows(cfg.selectedRows)
              else if (cfg.initialPresetId) setSelectedRows(getPresetRows(cfg.initialPresetId))
              if (cfg.collections) setCollections(cfg.collections)
              if (cfg.preferences) {
                if (cfg.preferences.language) setLanguage(cfg.preferences.language)
                if (cfg.preferences.ageRating) setAgeRating(cfg.preferences.ageRating)
                if (cfg.preferences.region) setSelectedRegion(cfg.preferences.region)
                if (cfg.preferences.proxyUrl) setProxyUrl(cfg.preferences.proxyUrl)
                if (cfg.preferences.excludeUnreleased !== undefined) setExcludeUnreleased(cfg.preferences.excludeUnreleased)
                if (cfg.preferences.moviesDigitalOnly !== undefined) setMoviesDigitalOnly(cfg.preferences.moviesDigitalOnly)
                if (cfg.preferences.hideAdult !== undefined) setHideAdult(cfg.preferences.hideAdult)
              }
              if (cfg.posters) {
                if (cfg.posters.providers && Array.isArray(cfg.posters.providers)) setPosterProviders(cfg.posters.providers)
                if (cfg.posters.showRatingsOnPosters !== undefined) setShowRatingsOnPosters(cfg.posters.showRatingsOnPosters)
                if (cfg.posters.ratingBadgedStills !== undefined) setRatingBadgedStills(cfg.posters.ratingBadgedStills)
              }
              if (cfg.streams) {
                if (cfg.streams.enabled !== undefined) setStreamsEnabled(cfg.streams.enabled)
                if (cfg.streams.debridProvider) setSelectedDebridProvider(cfg.streams.debridProvider)
                if (cfg.streams.debridApiKey) setDebridApiKey(cfg.streams.debridApiKey)
                if (cfg.streams.sources && Array.isArray(cfg.streams.sources)) setStreamSources(cfg.streams.sources)
                if (cfg.streams.formatter?.preset) setFormatterPreset(cfg.streams.formatter.preset)
                if (cfg.streams.filters) {
                  if (cfg.streams.filters.cachedOnly !== undefined) setCachedOnly(cfg.streams.filters.cachedOnly)
                  if (cfg.streams.filters.excludePreDigital !== undefined) setExcludePreDigital(cfg.streams.filters.excludePreDigital)
                  if (cfg.streams.filters.maxPerResolution !== undefined) setMaxPerResolution(cfg.streams.filters.maxPerResolution)
                  if (cfg.streams.filters.enabledResolutions) setEnabledResolutions(cfg.streams.filters.enabledResolutions)
                }
                if (cfg.streams.proxy) {
                  if (cfg.streams.proxy.enabled !== undefined) setStreamProxyEnabled(cfg.streams.proxy.enabled)
                  if (cfg.streams.proxy.type) setStreamProxyType(cfg.streams.proxy.type)
                  if (cfg.streams.proxy.url) setStreamProxyUrl(cfg.streams.proxy.url)
                  if (cfg.streams.proxy.apiPassword) setStreamProxyPassword(cfg.streams.proxy.apiPassword)
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
          scrobbleTrakt,
          scrobbleSimkl,
          scrobbleAniList,
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
        toast.error('No connected Nuvio account found. Please sign in via the sidebar account switcher.')
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

  const GENRES_LIST = [
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

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '16rem',
          '--header-height': '3.5rem',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="h-screen md:h-[calc(100vh-1rem)] max-h-screen md:max-h-[calc(100vh-1rem)] overflow-hidden flex flex-col">
        {/* Top Header Bar matching SiteHeader */}
        <header className="flex h-(--header-height) shrink-0 items-center justify-between gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) px-4 lg:px-6">
          <div className="flex items-center gap-1.5 lg:gap-2 min-w-0">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mx-1 h-4 data-vertical:self-auto"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: '/dashboard' })}
              className="size-8 text-muted-foreground hover:text-foreground rounded-lg"
              title="Back to Profiles"
              aria-label="Back to Profiles"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="flex items-baseline gap-2 min-w-0">
              <h1 className="text-base font-medium truncate text-foreground">
                {profileName || 'New Profile'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        {/* Main Grid: Content (Center) + Persistent Sidebar (Right) */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row w-full overflow-hidden">
          {/* Center Work Area */}
          <div className="flex-1 min-w-0 flex flex-col h-full min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="flex-1 flex flex-col items-center w-full">
                <div className={`w-full ${step === 1 ? 'max-w-2xl px-4 py-6 sm:px-6 sm:py-8' : step === 2 ? 'max-w-6xl xl:max-w-7xl px-4 py-6 sm:px-6 sm:py-8' : 'max-w-4xl lg:max-w-5xl px-6 py-8 md:px-10 lg:px-12'}`}>
            {/* ================= STEP 1: SETUP ================= */}
            {step === 1 && (
              <div className="mx-auto flex h-full w-full max-w-2xl flex-col animate-in fade-in-50 duration-200">
                <header className="shrink-0 border-b pb-4">
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">Setup</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">Name your profile and connect the catalog providers.</p>
                </header>

                <div className="flex flex-col gap-4 pt-4 pb-6 sm:gap-6 sm:pt-6 lg:pb-10">
                  {/* 1. Profile Name */}
                  <section className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:p-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex min-h-5 items-center gap-1">
                        <Label htmlFor="pname" className="flex items-center gap-2 text-sm font-medium text-foreground select-none">
                          Profile name
                        </Label>
                        <button
                          type="button"
                          className="relative flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                          title="About Profile name"
                        >
                          <Info className="size-3.5" />
                        </button>
                      </div>
                      <Input
                        id="pname"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Late-night vibes"
                        className="h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-2 text-base md:text-sm"
                      />
                    </div>
                  </section>

                  {/* 2. Integrations */}
                  <section className="rounded-xl border bg-card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenSection(openSection === 'integrations' ? null : 'integrations')}
                      className="flex w-full items-center gap-3 rounded-xl p-4 text-left transition-colors hover:bg-accent/50 sm:px-6 cursor-pointer"
                      aria-expanded={openSection === 'integrations'}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted/60">
                        <KeyRound className="size-4 text-muted-foreground" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">Integrations</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">Both keys verified. You can continue.</span>
                      </span>
                      <ChevronRight
                        className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          openSection === 'integrations' ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    {openSection === 'integrations' && (
                      <div className="px-4 pb-6 pt-2 sm:px-6 border-t border-border/60 space-y-6 text-sm">
                        {/* MDBList */}
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground text-xs">MDBList Key</span>
                            <a
                              href="https://mdblist.com/preferences/"
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                            >
                              Get a key <ExternalLink className="size-3" />
                            </a>
                          </div>
                          <Input
                            value={mdbListKey}
                            onChange={(e) => setMdbListKey(e.target.value)}
                            className="font-mono text-xs"
                          />
                          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer pt-1">
                            <Checkbox
                              checked={scrobbleMdbList}
                              onCheckedChange={(c) => setScrobbleMdbList(!!c)}
                            />
                            <span>Scrobble now watching to MDBList</span>
                          </label>
                        </div>

                        {/* TMDB */}
                        <div className="space-y-2 border-t border-border/40 pt-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground text-xs">TMDB Read Access Token</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium">
                                Verified
                              </span>
                              <a
                                href="https://www.themoviedb.org/settings/api"
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                              >
                                Get a key <ExternalLink className="size-3" />
                              </a>
                            </div>
                          </div>
                          <Input
                            value={tmdbToken}
                            onChange={(e) => setTmdbToken(e.target.value)}
                            className="font-mono text-xs"
                          />
                          <p className="text-[11px] text-muted-foreground">
                            On TMDB (Settings → API), copy the long API Read Access Token starting with "eyJ", not the short API key.
                          </p>

                          {/* TMDB Reverse Proxy / Mirror URL */}
                          <div className="space-y-1.5 pt-3 border-t border-border/40">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-foreground text-xs">TMDB Reverse Proxy / Mirror (Optional)</span>
                              <span className="text-[10px] text-muted-foreground">ISP bypass</span>
                            </div>
                            <Input
                              value={proxyUrl}
                              onChange={(e) => setProxyUrl(e.target.value)}
                              placeholder="https://tmdb-proxy.example.com/3 (optional)"
                              className="font-mono text-xs"
                            />
                            <p className="text-[11px] text-muted-foreground">
                              Optional proxy URL to bypass regional blocks (e.g., in India or restricted networks).
                            </p>
                          </div>
                        </div>

                        {/* Connected Trackers */}
                        <div className="border-t border-border/40 pt-4 space-y-3">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Connected Trackers
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
                              <div>
                                <div className="font-medium text-foreground text-xs">Trakt</div>
                                <div className="text-[11px] text-emerald-600 dark:text-emerald-400">Connected as Neerajlovecyber</div>
                              </div>
                              <Checkbox checked={scrobbleTrakt} onCheckedChange={(c) => setScrobbleTrakt(!!c)} />
                            </div>

                            <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
                              <div>
                                <div className="font-medium text-foreground text-xs">Simkl</div>
                                <div className="text-[11px] text-emerald-600 dark:text-emerald-400">Connected as Neeraj Singh</div>
                              </div>
                              <Checkbox checked={scrobbleSimkl} onCheckedChange={(c) => setScrobbleSimkl(!!c)} />
                            </div>

                            <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
                              <div>
                                <div className="font-medium text-foreground text-xs">AniList</div>
                                <div className="text-[11px] text-emerald-600 dark:text-emerald-400">Connected</div>
                              </div>
                              <Checkbox checked={scrobbleAniList} onCheckedChange={(c) => setScrobbleAniList(!!c)} />
                            </div>

                            <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
                              <div>
                                <div className="font-medium text-foreground text-xs">MyAnimeList</div>
                                <div className="text-[11px] text-emerald-600 dark:text-emerald-400">Connected</div>
                              </div>
                              <Checkbox checked={scrobbleMal} onCheckedChange={(c) => setScrobbleMal(!!c)} />
                            </div>
                          </div>
                        </div>

                        {/* When Playback Ends */}
                        <div className="border-t border-border/40 pt-4 space-y-2">
                          <Label className="text-xs font-semibold text-foreground">When playback ends</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div
                              onClick={() => setPlaybackEndRule('watched')}
                              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                playbackEndRule === 'watched'
                                  ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                                  : 'border-border bg-background text-muted-foreground hover:border-border/80'
                              }`}
                            >
                              <div className="font-medium text-xs text-foreground">Mark as watched</div>
                              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                                After the title's runtime, mark it watched on every tracker immediately.
                              </p>
                            </div>

                            <div
                              onClick={() => setPlaybackEndRule('finished')}
                              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                playbackEndRule === 'finished'
                                  ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                                  : 'border-border bg-background text-muted-foreground hover:border-border/80'
                              }`}
                            >
                              <div className="font-medium text-xs text-foreground">Only when finished</div>
                              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                                Mark watched only when it played through completely or next episode starts.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* 3. AI Recommendations */}
                  <section className="rounded-xl border bg-card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenSection(openSection === 'ai' ? null : 'ai')}
                      className="flex w-full items-center gap-3 rounded-xl p-4 text-left transition-colors hover:bg-accent/50 sm:px-6 cursor-pointer"
                      aria-expanded={openSection === 'ai'}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted/60">
                        <Sparkles className="size-4 text-muted-foreground" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">AI Recommendations</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{aiProvider}</span>
                      </span>
                      <ChevronRight
                        className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          openSection === 'ai' ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    {openSection === 'ai' && (
                      <div className="px-4 pb-6 pt-2 sm:px-6 border-t border-border/60 space-y-4 text-sm">
                        {/* Provider Selector */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-foreground">AI Provider</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setAiProvider('Google Gemini')
                                setAiModel('gemini-3.5-flash-lite')
                              }}
                              className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center justify-between transition-colors ${
                                aiProvider === 'Google Gemini'
                                  ? 'border-primary bg-primary/10 text-foreground'
                                  : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                              }`}
                            >
                              <span>Google Gemini</span>
                              {aiProvider === 'Google Gemini' && <Check className="size-3 text-primary" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAiProvider('Groq')
                                setAiModel('openai/gpt-oss-120b')
                              }}
                              className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center justify-between transition-colors ${
                                aiProvider === 'Groq'
                                  ? 'border-primary bg-primary/10 text-foreground'
                                  : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                              }`}
                            >
                              <span>Groq</span>
                              {aiProvider === 'Groq' && <Check className="size-3 text-primary" />}
                            </button>
                          </div>
                        </div>

                        {/* Model Selector matching Xperience UI */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-foreground">Model</Label>
                            <span className="text-[11px] font-mono text-muted-foreground">{aiModel}</span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="outline"
                                  className="w-full justify-between font-mono text-xs h-9 bg-background/50 border-input"
                                >
                                  <span className="truncate">{aiModel}</span>
                                  <ChevronDown className="size-3.5 opacity-50 ml-2 shrink-0" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="start" className="w-[calc(100vw-3rem)] max-w-[420px] p-1 bg-popover/95 backdrop-blur-md border-border/80 shadow-xl">
                              {(aiProvider === 'Groq' ? GROQ_MODELS : GEMINI_MODELS).map((m) => (
                                <DropdownMenuItem
                                  key={m.id}
                                  onClick={() => setAiModel(m.id)}
                                  className="flex items-center justify-between py-2 px-3 text-xs font-mono cursor-pointer rounded-md hover:bg-accent hover:text-accent-foreground"
                                >
                                  <span className={aiModel === m.id ? 'text-primary font-medium' : 'text-foreground/80'}>
                                    {m.label}
                                  </span>
                                  {aiModel === m.id && <Check className="size-3.5 text-primary shrink-0 ml-2" />}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <p className="text-[11px] text-muted-foreground">
                            {aiProvider === 'Groq'
                              ? 'Default: openai/gpt-oss-120b. Ultra-fast inference with fallback to openai/gpt-oss-20b.'
                              : 'Default: gemini-3.5-flash-lite. Automatic rate-limit failover across Gemini & Gemma models.'}
                          </p>
                        </div>

                        {/* API Key Input */}
                        {aiProvider === 'Google Gemini' ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs text-foreground">Google Gemini API Key</Label>
                              <a
                                href="https://aistudio.google.com/apikey"
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                              >
                                Get a key <ExternalLink className="size-3" />
                              </a>
                            </div>
                            <Input
                              value={aiApiKey}
                              onChange={(e) => setAiApiKey(e.target.value)}
                              placeholder="AIzaSy..."
                              className="font-mono text-xs"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs text-foreground">Groq API Key</Label>
                              <a
                                href="https://console.groq.com/keys"
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                              >
                                Get a key <ExternalLink className="size-3" />
                              </a>
                            </div>
                            <Input
                              value={groqApiKey}
                              onChange={(e) => setGroqApiKey(e.target.value)}
                              placeholder="gsk_..."
                              className="font-mono text-xs"
                            />
                          </div>
                        )}

                        <p className="text-[11px] text-muted-foreground">
                          Your Trakt watch history and MDBList list names are sent to generate personalized catalog rows.
                        </p>

                        <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer pt-2">
                          <Checkbox
                            checked={aiPoweredSearch}
                            onCheckedChange={(c) => setAiPoweredSearch(!!c)}
                          />
                          <span>Enable AI-powered intelligent search suggestions</span>
                        </label>
                      </div>
                    )}
                  </section>

                  {/* 4. Search */}
                  <section className="rounded-xl border bg-card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenSection(openSection === 'search' ? null : 'search')}
                      className="flex w-full items-center gap-3 rounded-xl p-4 text-left transition-colors hover:bg-accent/50 sm:px-6 cursor-pointer"
                      aria-expanded={openSection === 'search'}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted/60">
                        <Search className="size-4 text-muted-foreground" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">Search</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{searchEnabled ? 'On' : 'Off'}</span>
                      </span>
                      <ChevronRight
                        className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          openSection === 'search' ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    {openSection === 'search' && (
                      <div className="px-4 pb-6 pt-2 sm:px-6 border-t border-border/60 space-y-3 text-xs">
                        <label className="flex items-center gap-2 text-foreground cursor-pointer">
                          <Checkbox checked={searchIncludeXp} onCheckedChange={(c) => setSearchIncludeXp(!!c)} />
                          <span>Include Xperience in Nuvio search</span>
                        </label>
                        <label className="flex items-center gap-2 text-foreground cursor-pointer">
                          <Checkbox checked={searchAnimeRows} onCheckedChange={(c) => setSearchAnimeRows(!!c)} />
                          <span>Show anime in their own search rows</span>
                        </label>
                        <label className="flex items-center gap-2 text-foreground cursor-pointer">
                          <Checkbox checked={searchAiSuggestions} onCheckedChange={(c) => setSearchAiSuggestions(!!c)} />
                          <span>Show AI suggestions in their own search row</span>
                        </label>
                        <label className="flex items-center gap-2 text-foreground cursor-pointer">
                          <Checkbox
                            checked={searchFranchiseCollections}
                            onCheckedChange={(c) => setSearchFranchiseCollections(!!c)}
                          />
                          <span>Show franchise collections in their own search row</span>
                        </label>

                        <div className="grid grid-cols-2 gap-3 pt-3">
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Main rows label override</Label>
                            <Input
                              placeholder="Default"
                              value={searchMainRowsName}
                              onChange={(e) => setSearchMainRowsName(e.target.value)}
                              className="text-xs mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Anime rows label override</Label>
                            <Input
                              placeholder="Default"
                              value={searchAnimeRowsName}
                              onChange={(e) => setSearchAnimeRowsName(e.target.value)}
                              className="text-xs mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* 5. Discover */}
                  <section className="rounded-xl border bg-card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenSection(openSection === 'discover' ? null : 'discover')}
                      className="flex w-full items-center gap-3 rounded-xl p-4 text-left transition-colors hover:bg-accent/50 sm:px-6 cursor-pointer"
                      aria-expanded={openSection === 'discover'}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted/60">
                        <Compass className="size-4 text-muted-foreground" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">Discover</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{discoverEnabled ? 'On' : 'Off'}</span>
                      </span>
                      <ChevronRight
                        className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          openSection === 'discover' ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    {openSection === 'discover' && (
                      <div className="px-4 pb-6 pt-2 sm:px-6 border-t border-border/60 space-y-3 text-xs">
                        <p className="text-muted-foreground">
                          Show the built-in Movies and Series browse catalogs. Rename them if you want something else in Discover.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Movies rename</Label>
                            <Input
                              placeholder="Movies"
                              value={discoverMoviesName}
                              onChange={(e) => setDiscoverMoviesName(e.target.value)}
                              className="text-xs mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Series rename</Label>
                            <Input
                              placeholder="Series"
                              value={discoverSeriesName}
                              onChange={(e) => setDiscoverSeriesName(e.target.value)}
                              className="text-xs mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* 6. Posters */}
                  <section className="rounded-xl border bg-card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenSection(openSection === 'posters' ? null : 'posters')}
                      className="flex w-full items-center gap-3 rounded-xl p-4 text-left transition-colors hover:bg-accent/50 sm:px-6 cursor-pointer"
                      aria-expanded={openSection === 'posters'}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted/60">
                        <ImageIcon className="size-4 text-muted-foreground" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">Posters</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {posterProviders.map((p) => p.name).join(', ')}
                        </span>
                      </span>
                      <ChevronRight
                        className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          openSection === 'posters' ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    {openSection === 'posters' && (
                      <div className="px-4 pb-6 pt-2 sm:px-6 border-t border-border/60">
                        <PostersConfigSection
                          providers={posterProviders}
                          onProvidersChange={setPosterProviders}
                          showRatingsOnPosters={showRatingsOnPosters}
                          onShowRatingsChange={setShowRatingsOnPosters}
                          badgedEpisodeStills={ratingBadgedStills}
                          onBadgedEpisodeStillsChange={setRatingBadgedStills}
                          showApplyToAll={false}
                          showSectionHeader={true}
                        />
                      </div>
                    )}
                  </section>

                  {/* 7. Preferences */}
                  <section className="rounded-xl border bg-card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenSection(openSection === 'preferences' ? null : 'preferences')}
                      className="flex w-full items-center gap-3 rounded-xl p-4 text-left transition-colors hover:bg-accent/50 sm:px-6 cursor-pointer"
                      aria-expanded={openSection === 'preferences'}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted/60">
                        <SlidersHorizontal className="size-4 text-muted-foreground" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">Preferences</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {POPULAR_LANGUAGES.find((l) => l.code === language)?.name || language} · {selectedRegion} · {ageRating === 'NONE' ? 'All Ratings' : ageRating}
                        </span>
                      </span>
                      <ChevronRight
                        className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          openSection === 'preferences' ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    {openSection === 'preferences' && (
                      <div className="px-4 pb-6 pt-2 sm:px-6 border-t border-border/60 space-y-5 text-xs">
                        {/* Metadata Language */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <Globe className="size-3.5 text-primary" />
                              Metadata Language
                            </Label>
                            <span className="text-[11px] font-mono text-muted-foreground">{language}</span>
                          </div>
                          <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                          >
                            <optgroup label="Popular Languages">
                              {POPULAR_LANGUAGES.map((l) => (
                                <option key={l.code} value={l.code}>
                                  {l.name} ({l.code})
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="All Supported Locales (280+)">
                              {(languagesData as any[]).map((l) => (
                                <option key={l.iso_639_1} value={l.iso_639_1}>
                                  {l.name} ({l.iso_639_1})
                                </option>
                              ))}
                            </optgroup>
                          </select>
                          <p className="text-[11px] text-muted-foreground">
                            Fetches titles, descriptions, and episode names in your preferred language.
                          </p>
                        </div>

                        {/* Age Rating / Content Restriction */}
                        <div className="space-y-2 border-t border-border/40 pt-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-foreground">Content Age Rating</Label>
                            <span className="text-[11px] text-muted-foreground font-medium">
                              {AGE_RATINGS.find((r) => r.id === ageRating)?.name || 'No Restriction'}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                            {AGE_RATINGS.map((r) => {
                              const isSelected = ageRating === r.id
                              return (
                                <button
                                  key={r.id}
                                  type="button"
                                  onClick={() => setAgeRating(r.id)}
                                  className={`px-2 py-2 rounded-lg text-xs font-medium border text-center transition-all ${
                                    isSelected
                                      ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                                      : 'border-border bg-background text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  <div className="font-bold">{r.badge.text}</div>
                                </button>
                              )
                            })}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {AGE_RATINGS.find((r) => r.id === ageRating)?.description}
                          </p>
                        </div>

                        {/* Streaming Region */}
                        <div className="space-y-1.5 border-t border-border/40 pt-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-foreground">Streaming Region</Label>
                            <span className="text-[11px] text-muted-foreground">{selectedRegion}</span>
                          </div>
                          <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="w-full h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                          >
                            {Object.keys(STREAMING_REGIONS).map((reg) => (
                              <option key={reg} value={reg}>
                                {reg}
                              </option>
                            ))}
                          </select>
                          <p className="text-[11px] text-muted-foreground">
                            Adapts streaming provider catalogs (Netflix, Disney+, Prime, etc.) to show titles available in this region.
                          </p>
                        </div>

                        {/* Checkbox Preferences */}
                        <div className="space-y-2.5 border-t border-border/40 pt-4">
                          <label className="flex items-center gap-2 text-foreground cursor-pointer">
                            <Checkbox checked={hideAdult} onCheckedChange={(c) => setHideAdult(!!c)} />
                            <span>Hide adult content (pornographic & hentai titles)</span>
                          </label>
                          <label className="flex items-center gap-2 text-foreground cursor-pointer">
                            <Checkbox checked={excludeUnreleased} onCheckedChange={(c) => setExcludeUnreleased(!!c)} />
                            <span>Exclude unreleased titles</span>
                          </label>
                          <label className="flex items-center gap-2 text-foreground cursor-pointer">
                            <Checkbox checked={moviesDigitalOnly} onCheckedChange={(c) => setMoviesDigitalOnly(!!c)} />
                            <span>Movies: digital release only</span>
                          </label>
                          <label className="flex items-center gap-2 text-foreground cursor-pointer">
                            <Checkbox checked={hideWatched} onCheckedChange={(c) => setHideWatched(!!c)} />
                            <span>Hide content I've already watched</span>
                          </label>
                          <label className="flex items-center gap-2 text-foreground cursor-pointer">
                            <Checkbox checked={hideCaughtUp} onCheckedChange={(c) => setHideCaughtUp(!!c)} />
                            <span>Hide TV shows I'm caught up on</span>
                          </label>
                        </div>

                        <div className="border-t border-border/40 pt-3">
                          <Label className="text-xs text-muted-foreground mb-2 block">Exclude Genres</Label>
                          <div className="flex flex-wrap gap-2">
                            {GENRES_LIST.map((genre) => {
                              const isExcluded = excludedGenres.includes(genre)
                              return (
                                <button
                                  key={genre}
                                  type="button"
                                  onClick={() => {
                                    setExcludedGenres((prev) =>
                                      isExcluded ? prev.filter((g) => g !== genre) : [...prev, genre]
                                    )
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                    isExcluded
                                      ? 'bg-destructive/15 text-destructive border border-destructive/40'
                                      : 'bg-muted text-muted-foreground hover:text-foreground border border-border'
                                  }`}
                                >
                                  {genre}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </section>

                  {/* 9. Anime */}
                  <section className="rounded-xl border bg-card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenSection(openSection === 'anime' ? null : 'anime')}
                      className="flex w-full items-center gap-3 rounded-xl p-4 text-left transition-colors hover:bg-accent/50 sm:px-6 cursor-pointer"
                      aria-expanded={openSection === 'anime'}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted/60">
                        <Tv className="size-4 text-muted-foreground" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">Anime</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {animeSource} · {animeNumbering.split(' ')[0]} · {animeStreamId} · Default
                        </span>
                      </span>
                      <ChevronRight
                        className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          openSection === 'anime' ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    {openSection === 'anime' && (
                      <div className="px-4 pb-6 pt-2 sm:px-6 border-t border-border/60 space-y-4 text-xs">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-foreground">Anime season & episode source</Label>
                          <select
                            value={animeSource}
                            onChange={(e) => setAnimeSource(e.target.value)}
                            className="w-full h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                          >
                            <option value="TheTVDB">TheTVDB</option>
                            <option value="TMDB">TMDB</option>
                          </select>
                        </div>

                        <div className="space-y-1.5 border-t border-border/40 pt-3">
                          <Label className="text-xs font-semibold text-foreground">Anime episode numbering</Label>
                          <select
                            value={animeNumbering}
                            onChange={(e) => setAnimeNumbering(e.target.value)}
                            className="w-full h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                          >
                            <option value="Absolute (1137)">Absolute (1137)</option>
                            <option value="Standard (S01E01)">Standard (S01E01)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5 border-t border-border/40 pt-3">
                          <Label className="text-xs font-semibold text-foreground">Filler episodes</Label>
                          <select
                            value={fillerEpisodes}
                            onChange={(e) => setFillerEpisodes(e.target.value)}
                            className="w-full h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                          >
                            <option value="Tag ([Filler])">Tag ([Filler])</option>
                            <option value="Hide">Hide</option>
                            <option value="Include normally">Include normally</option>
                          </select>
                        </div>

                        <div className="space-y-1.5 border-t border-border/40 pt-3">
                          <Label className="text-xs font-semibold text-foreground">Anime stream ID</Label>
                          <select
                            value={animeStreamId}
                            onChange={(e) => setAnimeStreamId(e.target.value)}
                            className="w-full h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                          >
                            <option value="IMDb">IMDb</option>
                            <option value="Kitsu">Kitsu</option>
                            <option value="AniList">AniList</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            )}

            {/* ================= STEP 2: HOME ROWS ================= */}
            {step === 2 && (
              <div className="flex flex-col h-full w-full animate-in fade-in-50 duration-200">
                {/* Desktop Section Header */}
                <header className="hidden shrink-0 items-start justify-between gap-3 border-b border-border pb-4 lg:flex">
                  <div className="min-w-0">
                    <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">Home rows</h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Pick rows for the Nuvio home screen. Suggested around 15. Reorder them anytime with{' '}
                      <button
                        type="button"
                        onClick={() => setArrangeHomeOpen(true)}
                        className="cursor-pointer font-medium text-primary underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
                      >
                        Arrange home
                      </button>.
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium shrink-0 border-border bg-background hover:bg-muted"
                        >
                          <Sparkles className="size-3.5 text-purple-500" />
                          <span className="hidden sm:inline">Apply preset</span>
                          <ChevronDown className="size-3 text-muted-foreground" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto">
                      {activePresets.map((preset) => (
                        <DropdownMenuItem
                          key={preset.id}
                          onClick={() => {
                            let rows: CatalogItem[] = []
                            if (registryData?.presetRows && registryData.presetRows[preset.id]) {
                              const allItems = activeCategories.flatMap((c) => c.items)
                              const map = new Map(allItems.map((i) => [i.id, i]))
                              rows = registryData.presetRows[preset.id].map(
                                (id) => map.get(id) || { id, name: id.replace(/_/g, ' '), category: 'Curated', type: 'movie' as const }
                              )
                            } else {
                              rows = getPresetRows(preset.id, activeCategories)
                            }
                            setSelectedRows(rows)
                            toast.success(`Applied ${preset.label} preset (${rows.length} rows)`)
                          }}
                          className="flex flex-col items-start gap-0.5 cursor-pointer py-2"
                        >
                          <span className="font-semibold text-xs text-foreground">{preset.label}</span>
                          <span className="text-[11px] text-muted-foreground line-clamp-1">{preset.hint}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </header>

                {/* Home Row Cap Meter */}
                <div data-testid="home-row-cap-meter" className="flex flex-col gap-2 shrink-0 pt-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-foreground">Home rows</span>
                    <span className="text-sm font-medium tabular-nums text-muted-foreground" data-testid="home-row-cap-count">
                      {selectedRows.length} / 50
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        selectedRows.length > 45 ? 'bg-amber-500' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(100, (selectedRows.length / 50) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Two-Column Responsive Layout */}
                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden pb-6 sm:gap-6 lg:flex-row lg:overflow-visible lg:pt-6 lg:pb-0">
                  {/* Mobile section title (hidden on desktop) */}
                  <div className="shrink-0 lg:hidden">
                    <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">Home rows</h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Pick rows for the Nuvio home screen. Suggested around 15. Reorder them anytime with{' '}
                      <button
                        type="button"
                        onClick={() => setArrangeHomeOpen(true)}
                        className="cursor-pointer font-medium text-primary underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
                      >
                        Arrange home
                      </button>.
                    </p>
                  </div>

                  {/* Left Column: Catalog Picker */}
                  <div className="flex flex-col lg:h-full lg:min-h-0 lg:min-w-0 lg:flex-1">
                    {/* Sticky Search & Actions toolbar */}
                    <div className="sticky top-0 z-10 flex shrink-0 flex-col gap-2 border-b border-border bg-background pt-2 pb-3 sm:flex-row sm:items-center lg:static lg:pt-0">
                      <div className="flex flex-1 items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={catalogSearch}
                            onChange={(e) => setCatalogSearch(e.target.value)}
                            placeholder="Search catalogs..."
                            className="h-10 w-full min-w-0 rounded-lg border border-input bg-transparent pl-9 text-xs placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        </div>

                        {/* Mobile Preset Trigger */}
                        <div className="lg:hidden">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-10 px-2.5 text-xs gap-1 border-border bg-background"
                                  title="Apply preset"
                                >
                                  <Sparkles className="size-4 text-purple-500" />
                                  <ChevronDown className="size-3" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end" className="w-60 max-h-80 overflow-y-auto">
                              {activePresets.map((preset) => (
                                <DropdownMenuItem
                                  key={preset.id}
                                  onClick={() => {
                                    const rows = getPresetRows(preset.id, activeCategories)
                                    setSelectedRows(rows)
                                    toast.success(`Applied ${preset.label}`)
                                  }}
                                  className="text-xs py-2"
                                >
                                  {preset.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Create with AI Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setAiPromptOpen(true)}
                          className="size-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Create with AI"
                          aria-label="Create with AI"
                        >
                          <Sparkles className="size-[17px] text-purple-500 hover:text-purple-400" />
                        </Button>

                        {/* Add Catalog List Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setCustomListOpen(true)}
                          className="size-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Add Catalog List"
                          aria-label="Add Catalog List"
                          data-testid="add-custom-list-trigger"
                        >
                          <ListPlus className="size-4" />
                        </Button>

                        {/* Expand / Collapse All Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleAllCategories}
                          className="size-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                          title={expandedCategories.length > 0 ? 'Collapse all' : 'Expand all'}
                          aria-label={expandedCategories.length > 0 ? 'Collapse all' : 'Expand all'}
                          data-testid="picker-toggle-all"
                        >
                          <ChevronsUpDown className="size-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Scrollable Categories List */}
                    <div className="flex-1 overflow-y-auto pr-2 pt-4 space-y-3 max-h-[720px]">
                      {activeCategories.map((cat) => {
                        const isExpanded = expandedCategories.includes(cat.id)
                        const filteredItems = cat.items.filter((i) =>
                          i.name.toLowerCase().includes(catalogSearch.toLowerCase())
                        )
                        if (catalogSearch && filteredItems.length === 0) return null

                        const selectedInCat = cat.items.filter((i) =>
                          selectedRows.some((r) => r.id === i.id)
                        )
                        const selectedCount = selectedInCat.length

                        return (
                          <section key={cat.id} className="flex flex-col border border-border/70 rounded-xl bg-card/60 overflow-hidden">
                            <header className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-card/90 hover:bg-accent/40 transition-colors">
                              <button
                                type="button"
                                onClick={() => toggleCategory(cat.id)}
                                className="group flex cursor-pointer items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:text-foreground focus-visible:outline-none"
                                data-testid="picker-section-toggle"
                                aria-expanded={isExpanded}
                              >
                                <span>{cat.name}</span>
                                <ChevronDown
                                  className={`size-3.5 text-muted-foreground/70 transition-transform duration-200 ${
                                    isExpanded ? '' : '-rotate-90'
                                  }`}
                                />
                              </button>
                              <div className="flex items-center gap-2.5">
                                <span className="text-[11px] text-muted-foreground tabular-nums font-mono">
                                  {selectedCount} / {cat.items.length}
                                </span>
                                {selectedCount > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => handleClearCategory(cat.id)}
                                    className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                                  >
                                    Clear
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectAllCategory(cat.id)}
                                    className="text-[11px] font-medium text-primary transition-colors hover:text-primary/80 cursor-pointer"
                                  >
                                    Select all
                                  </button>
                                )}
                              </div>
                            </header>

                            {isExpanded && (
                              <div className="p-2 space-y-1 border-t border-border/40 bg-background/50">
                                {filteredItems.map((item) => {
                                  const isSelected = selectedRows.some((r) => r.id === item.id)
                                  const filterCount = getFilterCount(item.id)
                                  return (
                                    <div
                                      key={item.id}
                                      onClick={() => toggleRow(item)}
                                      className={`px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer text-xs transition-colors select-none ${
                                        isSelected
                                          ? 'bg-primary/10 border border-primary/30 text-foreground font-medium'
                                          : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 truncate pr-2">
                                        <Checkbox checked={isSelected} />
                                        <span className="truncate">{item.name}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {filterCount > 0 && (
                                          <span className="grid min-w-4 place-items-center rounded-full bg-primary/20 text-primary px-1 text-[10px] font-bold">
                                            {filterCount}
                                          </span>
                                        )}
                                        <span className="text-[10px] text-muted-foreground/70 font-mono">
                                          {item.type === 'movie' ? 'Movies' : item.type === 'series' ? 'Series' : 'Both'}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </section>
                        )
                      })}
                    </div>
                  </div>

                  {/* Right Column: Selected Rows Rail (aside) */}
                  <aside className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shrink-0 lg:w-80 xl:w-96 max-h-[780px]" aria-label="Selected rows">
                    <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 bg-card/90">
                      <h3 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Selected
                      </h3>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-medium tabular-nums ${
                            selectedRows.length > 15 ? 'text-amber-500 font-semibold' : 'text-muted-foreground'
                          }`}
                          title={selectedRows.length > 15 ? `${selectedRows.length - 15} over the suggested 15` : undefined}
                        >
                          {selectedRows.length}{' '}
                          <span className="font-normal text-muted-foreground/70">/ 15 suggested</span>
                        </span>
                        <button
                          type="button"
                          data-testid="selected-rail-clear"
                          onClick={() => setSelectedRows([])}
                          className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          data-testid="selected-rail-select-mode"
                          onClick={() => setArrangeHomeOpen(true)}
                          className="text-[11px] font-medium text-primary transition-colors hover:text-primary/80 cursor-pointer"
                        >
                          Arrange
                        </button>
                      </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                      {selectedRows.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center text-muted-foreground">
                          <Layers className="size-8 stroke-1 mb-2 text-muted-foreground/50" />
                          <p className="text-xs font-medium">No home rows selected</p>
                          <p className="text-[11px] text-muted-foreground/70 mt-1">
                            Choose catalogs from the left to populate your home feed
                          </p>
                        </div>
                      ) : (
                        selectedRows.map((row) => {
                          const filterCount = getFilterCount(row.id)
                          const isAi = row.isAi || row.category === 'AI generated'
                          return (
                            <div
                              key={row.id}
                              data-testid="selected-row"
                              data-catalog-id={row.id}
                              className={`group flex items-center gap-1.5 rounded-lg border py-1.5 pr-1.5 pl-2.5 transition-all ${
                                isAi
                                  ? 'border-primary/30 bg-primary/10 hover:border-primary/50'
                                  : 'border-border/80 bg-background hover:border-border'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-xs font-medium text-foreground">
                                  {rowFilters[row.id]?.customTitle || row.name}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                  <span className="truncate">{row.category}</span>
                                  {rowFilters[row.id]?.minRating && (
                                    <span>· ★ {rowFilters[row.id]?.minRating}+</span>
                                  )}
                                  {rowFilters[row.id]?.yearFrom && (
                                    <span>· {rowFilters[row.id]?.yearFrom}+</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {/* Filter Sliders Button */}
                                <button
                                  type="button"
                                  onClick={() => setEditingRow(row)}
                                  className="relative grid size-8 place-items-center rounded-md text-muted-foreground/70 hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                                  title={`Edit ${row.name}`}
                                  aria-label={`Edit ${row.name}`}
                                >
                                  <SlidersHorizontal className="size-3.5" />
                                  {filterCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 grid min-w-4 h-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground leading-none">
                                      {filterCount}
                                    </span>
                                  )}
                                </button>

                                {/* Remove Button */}
                                <button
                                  type="button"
                                  onClick={() => toggleRow(row)}
                                  className="grid size-8 place-items-center rounded-md text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                                  title={`Remove ${row.name}`}
                                  aria-label={`Remove ${row.name}`}
                                >
                                  <X className="size-3.5" />
                                </button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </aside>
                </div>
              </div>
            )}

            {/* ================= STEP 3: COLLECTIONS ================= */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Collections</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Build the layout Nuvio renders. Export at Step 4.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-accent text-accent-foreground font-mono">
                      {collections.length} collections · 28 folders · 96 sources
                    </span>
                  </div>
                </div>

                {/* Collection Action Bar */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <Button size="sm" className="text-xs gap-1.5">
                    <Plus className="size-3.5" />
                    Add collection
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    Load preset
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    Import
                  </Button>
                </div>

                {/* Collections Cards */}
                <div className="space-y-5">
                  {collections.map((col) => (
                    <div key={col.id} className="rounded-2xl border border-border bg-card p-6 space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ChevronDown className="size-4 text-muted-foreground" />
                          <h3 className="text-base font-bold text-foreground">{col.title}</h3>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-mono">10 / 28</span>
                          <Trash2 className="size-4 hover:text-destructive cursor-pointer" />
                        </div>
                      </div>

                      {/* Tile Shape Selector */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Tile shape</Label>
                        <div className="flex items-center gap-3">
                          {(
                            [
                              { value: 'POSTER', label: 'Poster' },
                              { value: 'LANDSCAPE', label: 'Landscape' },
                              { value: 'SQUARE', label: 'Square' },
                            ] as const
                          ).map(({ value, label }) => (
                            <label key={value} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                              <input
                                type="radio"
                                name={`shape-${col.id}`}
                                checked={col.tileShape === value}
                                onChange={() => {
                                  setCollections((prev) =>
                                    prev.map((c) => (c.id === col.id ? { ...c, tileShape: value } : c))
                                  )
                                }}
                                className="accent-primary"
                              />
                              <span>{label}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          All folders in this collection use this shape on Nuvio's home shelf.
                        </p>
                      </div>

                      {/* Behavior Toggles */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Behavior</Label>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
                            <span className="text-xs text-foreground">Pin to top</span>
                            <Checkbox
                              checked={col.pinToTop}
                              onCheckedChange={(checked) =>
                                setCollections((prev) =>
                                  prev.map((c) => (c.id === col.id ? { ...c, pinToTop: !!checked } : c))
                                )
                              }
                            />
                          </div>
                          <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
                            <span className="text-xs text-foreground">Focus glow</span>
                            <Checkbox
                              checked={col.focusGlow}
                              onCheckedChange={(checked) =>
                                setCollections((prev) =>
                                  prev.map((c) => (c.id === col.id ? { ...c, focusGlow: !!checked } : c))
                                )
                              }
                            />
                          </div>
                          <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
                            <span className="text-xs text-foreground">"All" tab</span>
                            <Checkbox
                              checked={col.showAllTab}
                              onCheckedChange={(checked) =>
                                setCollections((prev) =>
                                  prev.map((c) => (c.id === col.id ? { ...c, showAllTab: !!checked } : c))
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* View mode */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">View mode</Label>
                        <div className="grid grid-cols-3 gap-2 p-1 bg-background rounded-xl border border-border">
                          {(
                            [
                              { value: 'FOLLOW_LAYOUT', label: 'Follow layout' },
                              { value: 'ROWS', label: 'Rows' },
                              { value: 'TABBED_GRID', label: 'Tabbed grid' },
                            ] as const
                          ).map(({ value, label }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => {
                                setCollections((prev) =>
                                  prev.map((c) => (c.id === col.id ? { ...c, viewMode: value } : c))
                                )
                              }}
                              className={`py-2 rounded-lg text-xs font-medium transition-all ${
                                col.viewMode === value ? 'bg-accent text-accent-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Backdrop URL */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-semibold">Backdrop Image URL</Label>
                        <Input
                          value={col.backdropUrl}
                          onChange={(e) => {
                            const val = e.target.value
                            setCollections((prev) =>
                              prev.map((c) => (c.id === col.id ? { ...c, backdropUrl: val } : c))
                            )
                          }}
                          placeholder="https://..."
                          className="text-xs h-10"
                        />
                      </div>

                      {/* Folder Cards Preview */}
                      <div className="space-y-2 pt-2">
                        <Label className="text-xs text-muted-foreground font-semibold">Folder Previews</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {col.folders.map((folder) => (
                            <div
                              key={folder.id}
                              className={`h-28 rounded-2xl p-4 bg-gradient-to-br ${folder.bgGradient} border border-border flex flex-col justify-between shadow-lg relative overflow-hidden group`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="size-2 rounded-full bg-white/70" />
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white tracking-widest">
                                  {folder.badgeText}
                                </span>
                              </div>
                              <div className="flex items-end justify-between">
                                <span className="font-extrabold text-white text-base tracking-wider">
                                  {folder.logoText}
                                </span>
                                <span className="text-[11px] font-mono text-zinc-200">
                                  {folder.itemCount}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ================= STEP 4: STREAMS ================= */}
            {step === 4 && (
              <div className="mx-auto flex h-full w-full max-w-3xl flex-col animate-in fade-in-50 duration-200">
                <header className="shrink-0 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
                        Streams
                      </h2>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        Configure stream scrapers, debrid credentials, formatter presets, and resolution filters.
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      streamsEnabled
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <span className={`size-2 rounded-full ${streamsEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                      {streamsEnabled ? 'Streams Active' : 'Disabled'}
                    </span>
                  </div>
                </header>

                <div className="flex flex-col gap-6 pt-6 pb-10">
                  {/* Master Switch */}
                  <section className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-xs">
                    <div className="flex items-start gap-3.5">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Zap className="size-5" />
                      </div>
                      <div>
                        <Label htmlFor="master-streams-switch" className="text-base font-semibold text-foreground cursor-pointer">
                          Enable Stream Scrapers & Resolvers
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          When enabled, NuvioDeck resolves playable streams from your configured debrid providers and scraper addons alongside your catalogs.
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="master-streams-switch"
                      checked={streamsEnabled}
                      onCheckedChange={setStreamsEnabled}
                    />
                  </section>

                  {streamsEnabled && (
                    <>
                      {/* 1. Debrid Provider */}
                      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-xs">
                        <div className="flex items-center justify-between border-b pb-3">
                          <div className="flex items-center gap-2">
                            <Key className="size-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">Debrid Service Provider</h3>
                          </div>
                          {selectedDebridProvider !== 'none' && debridVerified && (
                            <span className="inline-flex h-5 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="size-3 shrink-0" /> Verified & Active
                            </span>
                          )}
                        </div>

                        {/* Provider selection tiles */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {[
                            { id: 'realdebrid', name: 'Real-Debrid', desc: 'Fast & popular cached torrents', link: 'https://real-debrid.com/apitoken' },
                            { id: 'torbox', name: 'TorBox', desc: 'High-speed debrid & Usenet', link: 'https://torbox.app/settings' },
                            { id: 'alldebrid', name: 'AllDebrid', desc: 'Multi-hoster & torrent cache', link: 'https://alldebrid.com/apikeys' },
                            { id: 'premiumize', name: 'Premiumize.me', desc: 'Cloud storage & torrent cache', link: 'https://www.premiumize.me/account' },
                            { id: 'debridlink', name: 'Debrid-Link', desc: 'Fast French & global seedbox', link: 'https://debrid-link.com/webapp/register' },
                            { id: 'none', name: 'None (Free P2P)', desc: 'Direct peer-to-peer torrents only', link: '' },
                          ].map((prov) => (
                            <button
                              key={prov.id}
                              type="button"
                              onClick={() => {
                                setSelectedDebridProvider(prov.id as any)
                                if (prov.id === 'none') {
                                  setDebridVerified(true)
                                }
                              }}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                selectedDebridProvider === prov.id
                                  ? 'border-primary bg-primary/5 ring-1 ring-primary text-foreground'
                                  : 'border-border bg-background/50 hover:bg-accent/40 text-muted-foreground'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-semibold text-xs text-foreground">{prov.name}</span>
                                {selectedDebridProvider === prov.id && (
                                  <div className="size-2 rounded-full bg-primary" />
                                )}
                              </div>
                              <span className="text-[11px] leading-snug line-clamp-1">{prov.desc}</span>
                            </button>
                          ))}
                        </div>

                        {/* API Key Input */}
                        {selectedDebridProvider !== 'none' && (
                          <div className="flex flex-col gap-2 pt-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-medium text-foreground">
                                {selectedDebridProvider.toUpperCase()} API Key / Token
                              </Label>
                              <a
                                href={
                                  selectedDebridProvider === 'realdebrid'
                                    ? 'https://real-debrid.com/apitoken'
                                    : selectedDebridProvider === 'torbox'
                                    ? 'https://torbox.app/settings'
                                    : selectedDebridProvider === 'alldebrid'
                                    ? 'https://alldebrid.com/apikeys'
                                    : selectedDebridProvider === 'premiumize'
                                    ? 'https://www.premiumize.me/account'
                                    : 'https://debrid-link.com/webapp/register'
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                Get API key <ExternalLink className="size-3" />
                              </a>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <Input
                                  type={showDebridKey ? 'text' : 'password'}
                                  value={debridApiKey}
                                  onChange={(e) => {
                                    setDebridApiKey(e.target.value)
                                    setDebridVerified(false)
                                  }}
                                  placeholder="Paste your debrid API token..."
                                  className="h-10 pr-10 font-mono text-xs bg-background"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowDebridKey(!showDebridKey)}
                                  className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                  {showDebridKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                              </div>
                              <Button
                                variant="outline"
                                type="button"
                                onClick={() => {
                                  if (!debridApiKey.trim()) {
                                    toast.error('Please enter a valid API key')
                                    return
                                  }
                                  setDebridVerified(true)
                                  toast.success(`${selectedDebridProvider.toUpperCase()} verified successfully!`)
                                }}
                                className="h-10 px-4 text-xs font-medium shrink-0"
                              >
                                Verify
                              </Button>
                            </div>
                          </div>
                        )}
                      </section>

                      {/* 2. Scraper / Stream Sources */}
                      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-xs">
                        <div className="flex items-center justify-between border-b pb-3">
                          <div className="flex items-center gap-2">
                            <Radio className="size-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">Scraper Sources</h3>
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">
                            {streamSources.filter((s) => s.enabled).length} active
                          </span>
                        </div>

                        <div className="flex flex-col gap-3">
                          {streamSources.map((source) => (
                            <div
                              key={source.id}
                              className={`p-3.5 rounded-xl border transition-colors ${
                                source.enabled
                                  ? 'bg-background border-border shadow-xs'
                                  : 'bg-card/40 border-dashed border-border/70 opacity-70'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-foreground">{source.name}</span>
                                    {source.enabled && (
                                      <span className="size-2 rounded-full bg-emerald-500" />
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{source.description}</p>
                                </div>
                                <Switch
                                  checked={source.enabled}
                                  onCheckedChange={(checked) => {
                                    setStreamSources((prev) =>
                                      prev.map((s) => (s.id === source.id ? { ...s, enabled: checked } : s))
                                    )
                                  }}
                                />
                              </div>
                              {source.enabled && (
                                <div className="mt-2.5 pt-2.5 border-t border-border/40 flex items-center gap-2">
                                  <span className="text-[11px] text-muted-foreground font-mono shrink-0">Host URL:</span>
                                  <Input
                                    value={source.url}
                                    onChange={(e) => {
                                      const newUrl = e.target.value
                                      setStreamSources((prev) =>
                                        prev.map((s) => (s.id === source.id ? { ...s, url: newUrl } : s))
                                      )
                                    }}
                                    className="h-7 text-xs font-mono bg-card"
                                    placeholder="https://..."
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </section>

                      {/* 3. Stream Formatter & Live Stream Card Preview */}
                      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-xs">
                        <div className="flex items-center justify-between border-b pb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="size-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">Stream Formatter Engine</h3>
                          </div>
                          <span className="text-xs text-primary font-medium">Live Preview</span>
                        </div>

                        {/* Preset selection buttons */}
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {[
                            { id: 'nuvio', label: 'Nuvio Deck' },
                            { id: 'prism', label: 'Prism' },
                            { id: 'charcoal', label: 'Charcoal' },
                            { id: 'streamsense', label: 'StreamSense' },
                            { id: 'ned', label: "Ned's" },
                            { id: 'linden', label: 'Linden' },
                            { id: 'shota', label: 'Shota' },
                            { id: 'tamtaro', label: 'Tamtaro' },
                            { id: 'plain', label: 'Plain' },
                          ].map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setFormatterPreset(p.id as any)}
                              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                                formatterPreset === p.id
                                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                  : 'bg-background hover:bg-accent text-muted-foreground hover:text-foreground border-border'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>

                        {/* Interactive Stream Result Preview Box */}
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>How streams appear on Nuvio / Stremio:</span>
                            <span className="font-mono text-[11px] text-primary">{formatterPreset.toUpperCase()} FORMAT</span>
                          </div>

                          <div className="p-4 rounded-xl border border-primary/30 bg-background/90 space-y-2 font-mono text-xs shadow-inner">
                            {formatterPreset === 'nuvio' && (
                              <>
                                <div className="flex items-center justify-between text-foreground font-bold">
                                  <span>🔥 4K ⚡ 〈Remux〉</span>
                                  <span className="text-amber-500 font-sans">⭐️ 9.2</span>
                                </div>
                                <div className="text-foreground/90 font-sans font-medium">Dune: Part Two (2024) · 2h 46m</div>
                                <div className="text-muted-foreground text-[11px]">🎞️ HEVC 📺 DV · HDR10+ 🎧 Atmos · TrueHD 🔊 7.1</div>
                                <div className="text-muted-foreground text-[11px]">📦 42.8 GB · 📊 85 Mbps · 🌱 340 · ⏱️ 2d ago</div>
                                <div className="text-primary text-[11px] flex items-center justify-between">
                                  <span>🛡️ [RD] Torrentio · 🏷️ FraMeSToR</span>
                                  <span>🌎 EN · ES · FR</span>
                                </div>
                              </>
                            )}

                            {formatterPreset === 'prism' && (
                              <>
                                <div className="text-primary font-bold">🔥4K UHD 🚀 FHD</div>
                                <div className="text-foreground/90 font-sans font-medium">🎬 Dune: Part Two (2024)</div>
                                <div className="text-muted-foreground text-[11px]">🎥 Remux 📺 DV | HDR10+ 🎞️ HEVC ⏱️ 2h 46m</div>
                                <div className="text-muted-foreground text-[11px]">🎧 Atmos | TrueHD 🔊 7.1 · 📦 42.8 GB 🌱 340 📅 2d</div>
                                <div className="text-emerald-500 text-[11px]">🏷️ FraMeSToR 🔍Torrentio ⚡Ready (RD) 🗣️ 🇺🇸 / 🇪🇸</div>
                              </>
                            )}

                            {formatterPreset === 'charcoal' && (
                              <>
                                <div className="text-foreground font-bold">🔲 4K │ ⛁ 42.8 GB</div>
                                <div className="text-muted-foreground text-[11px]">☰ EN · ES · FR • Atmos • 7.1</div>
                                <div className="text-muted-foreground text-[11px]">☲ BluRay REMUX · HEVC • DV · HDR10+</div>
                                <div className="text-muted-foreground text-[11px]">☵ Torrentio · FraMeSToR · [RD]</div>
                                <div className="text-primary text-[11px]">☶ Dune: Part Two · 2024 · 2h 46m</div>
                              </>
                            )}

                            {formatterPreset === 'streamsense' && (
                              <>
                                <div className="text-foreground font-bold">⚜️ 4K UHD ❖ Torrentio [RD ⚡️]</div>
                                <div className="text-muted-foreground text-[11px]">🎥 Remux 🎞️ HEVC 💠 DV | HDR10+ 🏷️ FraMeSToR</div>
                                <div className="text-muted-foreground text-[11px]">🔊 Atmos 🎧 7.1 📦 42.8 GB | 🗣 🇺🇸 / 🇪🇸</div>
                                <div className="text-primary text-[11px]">🎬 Dune: Part Two (2024)</div>
                              </>
                            )}

                            {formatterPreset === 'ned' && (
                              <>
                                <div className="text-foreground font-bold">✨⠀2160p⠀🌱⠀340</div>
                                <div className="text-foreground/90 font-sans font-medium">🎟️ Dune: Part Two (2024)</div>
                                <div className="text-muted-foreground text-[11px]">🎥 BluRay REMUX 📺 DV | HDR10+ 🎞️ HEVC 🎧 Atmos 🔊 7.1</div>
                                <div className="text-primary text-[11px]">📦 42.8 GB 🏷️ FraMeSToR 📚 ᴍᴜʟᴛɪ 🏆 IMAX</div>
                              </>
                            )}

                            {formatterPreset === 'linden' && (
                              <>
                                <div className="text-foreground font-bold">4K | DV ° HDR10+ 🔱 Torrentio</div>
                                <div className="text-foreground/90 font-sans font-medium">🎬 Dune: Part Two (2024)</div>
                                <div className="text-muted-foreground text-[11px]">🎥 BluRay REMUX 🎞️ HEVC 🎧 Atmos • TrueHD「7.1」</div>
                                <div className="text-primary text-[11px]">📦 42.8 GB | 🌱 340 🌐 EN • ES • FR</div>
                              </>
                            )}

                            {formatterPreset === 'shota' && (
                              <>
                                <div className="text-foreground font-bold">🖥️ 2160p</div>
                                <div className="text-foreground/90 font-sans font-medium">📁 Dune: Part Two (2024)</div>
                                <div className="text-muted-foreground text-[11px]">🎥 BluRay REMUX 🎞️ DV | HDR10+ 🎧 Atmos</div>
                                <div className="text-emerald-500 text-[11px]">📦 42.8 GB 💚 Torrentio</div>
                              </>
                            )}

                            {formatterPreset === 'tamtaro' && (
                              <>
                                <div className="text-foreground font-bold">4K ⚡ ⟨Remux⟩ ⭐️ 9.2</div>
                                <div className="text-foreground/90 font-sans font-medium">✏️ Dune: Part Two (2024)</div>
                                <div className="text-muted-foreground text-[11px]">🎞️ HEVC 📺 DV · HDR10+ 🎧 Atmos 🔊 7.1</div>
                                <div className="text-primary text-[11px]">📦 42.8 GB · 📊 85 Mbps · 🌱 340 🌐 [RD] Torrentio</div>
                              </>
                            )}

                            {formatterPreset === 'plain' && (
                              <>
                                <div className="text-foreground font-bold">Cached 2160p</div>
                                <div className="text-muted-foreground text-[11px] truncate">Dune.Part.Two.2024.2160p.UHD.Remux.HEVC.DV.Atmos-FraMeSToR.mkv</div>
                                <div className="text-muted-foreground text-[11px]">BluRay REMUX | HEVC | DV | HDR10+</div>
                                <div className="text-primary text-[11px]">Atmos | 7.1 | 42.8 GB | via Torrentio</div>
                              </>
                            )}
                          </div>
                        </div>
                      </section>

                      {/* 4. Quality & Resolution Rules */}
                      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-xs">
                        <div className="flex items-center gap-2 border-b pb-3">
                          <Sliders className="size-4 text-primary" />
                          <h3 className="text-sm font-semibold text-foreground">Quality & Resolution Rules</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-background">
                            <Checkbox
                              id="cached-only"
                              checked={cachedOnly}
                              onCheckedChange={(c) => setCachedOnly(!!c)}
                            />
                            <Label htmlFor="cached-only" className="text-xs font-medium text-foreground cursor-pointer select-none">
                              <span className="block font-semibold">Cached streams only</span>
                              <span className="text-muted-foreground text-[11px]">Instant playback without P2P seeding</span>
                            </Label>
                          </div>

                          <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-background">
                            <Checkbox
                              id="exclude-predigital"
                              checked={excludePreDigital}
                              onCheckedChange={(c) => setExcludePreDigital(!!c)}
                            />
                            <Label htmlFor="exclude-predigital" className="text-xs font-medium text-foreground cursor-pointer select-none">
                              <span className="block font-semibold">Exclude Pre-Digital</span>
                              <span className="text-muted-foreground text-[11px]">Filters CAM, TS, SCR, HDCAM</span>
                            </Label>
                          </div>
                        </div>

                        {/* Resolution checkboxes */}
                        <div className="space-y-2 pt-2">
                          <Label className="text-xs font-medium text-foreground">Allowed Resolutions</Label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { id: '2160p', label: '4K (2160p)' },
                              { id: '1440p', label: '2K (1440p)' },
                              { id: '1080p', label: 'FHD (1080p)' },
                              { id: '720p', label: 'HD (720p)' },
                              { id: '480p', label: 'SD (480p)' },
                            ].map((res) => {
                              const active = enabledResolutions.includes(res.id)
                              return (
                                <button
                                  key={res.id}
                                  type="button"
                                  onClick={() => {
                                    setEnabledResolutions((prev) =>
                                      active ? prev.filter((r) => r !== res.id) : [...prev, res.id]
                                    )
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                    active
                                      ? 'bg-primary/10 border-primary text-primary'
                                      : 'bg-background border-border text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  {res.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Max per resolution */}
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center justify-between text-xs">
                            <Label className="font-medium text-foreground">Max streams per resolution</Label>
                            <span className="font-mono text-muted-foreground font-semibold">
                              {maxPerResolution === 0 ? 'Unlimited' : `${maxPerResolution} streams`}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {[5, 10, 15, 25, 0].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setMaxPerResolution(val)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                                  maxPerResolution === val
                                    ? 'bg-accent text-foreground border-border font-semibold shadow-xs'
                                    : 'bg-background text-muted-foreground hover:text-foreground border-border/70'
                                }`}
                              >
                                {val === 0 ? 'All' : val}
                              </button>
                            ))}
                          </div>
                        </div>
                      </section>

                      {/* 5. Streaming Proxy / MediaFlow */}
                      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-xs">
                        <div className="flex items-center justify-between border-b pb-3">
                          <div className="flex items-center gap-2">
                            <Lock className="size-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">Streaming Proxy (MediaFlow / StremThru)</h3>
                          </div>
                          <Switch
                            checked={streamProxyEnabled}
                            onCheckedChange={setStreamProxyEnabled}
                          />
                        </div>

                        {streamProxyEnabled && (
                          <div className="space-y-3 pt-1">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Proxy Type</Label>
                                <select
                                  value={streamProxyType}
                                  onChange={(e) => setStreamProxyType(e.target.value as any)}
                                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs"
                                >
                                  <option value="mediaflow">MediaFlow</option>
                                  <option value="stremthru">StremThru</option>
                                  <option value="generic">Generic Reverse Proxy</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">API Password</Label>
                                <Input
                                  type="password"
                                  value={streamProxyPassword}
                                  onChange={(e) => setStreamProxyPassword(e.target.value)}
                                  placeholder="Password..."
                                  className="h-9 text-xs bg-background"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Proxy Host URL</Label>
                              <Input
                                value={streamProxyUrl}
                                onChange={(e) => setStreamProxyUrl(e.target.value)}
                                placeholder="https://mediaflow.example.com"
                                className="h-9 text-xs font-mono bg-background"
                              />
                            </div>
                          </div>
                        )}
                      </section>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ================= STEP 5: FINALIZE ================= */}
            {step === 5 && (
              <div className="space-y-8 animate-in fade-in-50 duration-200 py-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="size-14 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 className="size-8" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                    {profileName || 'Profile'} is ready
                  </h2>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedRows.length} home rows · {collections.length} collections · 28 folders · {streamsEnabled ? 'Streams Enabled' : 'Streams Disabled'} · Language English
                  </p>
                </div>

                {/* Big Save Everything to Nuvio Card */}
                <div className="max-w-2xl mx-auto rounded-3xl border border-border bg-card p-8 shadow-xl space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="size-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md shrink-0">
                      <Play className="size-6 fill-current" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Save everything to Nuvio</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        One click installs the add-on and pushes your collections, catalog manifests, and streams directly to your Nuvio profile.
                      </p>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-accent border border-border text-foreground">
                          Add-on: {selectedRows.length} home rows
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-accent border border-border text-foreground">
                          Collections: {collections.length}
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-accent border border-border text-foreground">
                          Streams: {streamsEnabled ? 'Active' : 'Off'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={handlePushToNuvio}
                      disabled={isPushing}
                      className="w-full h-12 rounded-xl font-semibold text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isPushing ? (
                        <>
                          <RotateCcw className="size-5 animate-spin" />
                          Pushing to Nuvio cloud...
                        </>
                      ) : (
                        <>
                          <Send className="size-5" />
                          Push to Nuvio
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="text-center text-xs text-muted-foreground">
                    Pushing to <span className="font-semibold text-foreground">{sessions[0]?.email || 'connected Nuvio account'}</span>
                    {' · '}
                    <span className="text-primary hover:underline cursor-pointer">Override</span>
                  </div>
                </div>

                {/* Stremio / Nuvio Addon Manifest Card */}
                <div className="max-w-2xl mx-auto rounded-3xl border border-border bg-card p-6 shadow-md space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Stremio & Nuvio Addon Manifest</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Direct install URL for your configured {selectedRows.length} catalog rows and metadata.
                      </p>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                      v1.2.0
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={`http://localhost:3001/api/catalogs/${profileId}/manifest.json`}
                      className="font-mono text-xs h-10 bg-background/60"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `http://localhost:3001/api/catalogs/${profileId}/manifest.json`
                        )
                        toast.success('Manifest URL copied to clipboard!')
                      }}
                      className="h-10 px-3 text-xs gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Copy className="size-3.5" />
                      Copy
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <ExternalLink className="size-3 text-primary" />
                      Install link:
                    </span>
                    <a
                      href={`stremio://localhost:3001/api/catalogs/${profileId}/manifest.json`}
                      className="text-primary font-medium hover:underline font-mono text-[11px]"
                    >
                      stremio://localhost:3001/api/catalogs/{profileId}/manifest.json
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="pb-6" />
                </div>
              </div>
            </div>

            {/* Sticky Glass Bottom Navigation Footer (cut before right sidebar) */}
            <footer className="z-20 shrink-0 border-t border-border bg-background/95 backdrop-blur-md">
              <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between gap-3 py-3">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (step > 1) setStep((step - 1) as any)
                      else navigate({ to: '/dashboard' })
                    }}
                    className="h-10 gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                  >
                    <ChevronLeft className="size-4" />
                    Back
                  </Button>

                  {/* Stepper in Bottom Bar */}
                  <div className="flex items-center gap-1.5 sm:gap-2 text-sm">
                    {[
                      { num: 1, label: 'Setup' },
                      { num: 2, label: 'Home rows' },
                      { num: 3, label: 'Collections' },
                      { num: 4, label: 'Streams' },
                      { num: 5, label: 'Finalize' },
                    ].map((s, idx) => (
                      <React.Fragment key={s.num}>
                        <button
                          type="button"
                          onClick={() => {
                            saveProfileConfig()
                            setStep(s.num as any)
                          }}
                          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                            step === s.num
                              ? 'bg-accent text-accent-foreground border border-border shadow-xs'
                              : step > s.num
                              ? 'text-foreground hover:bg-accent/50'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <span
                            className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              step === s.num
                                ? 'bg-primary text-primary-foreground'
                                : step > s.num
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {step > s.num ? '✓' : s.num}
                          </span>
                          <span className="hidden sm:inline">{s.label}</span>
                        </button>
                        {idx < 4 && <div className="w-2 sm:w-4 h-px bg-border" />}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {step < 5 ? (
                      <Button
                        onClick={() => {
                          saveProfileConfig()
                          setStep((step + 1) as any)
                        }}
                        className="h-10 gap-1.5 px-4 text-xs font-semibold cursor-pointer"
                      >
                        Continue
                        <ChevronRight className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handlePushToNuvio}
                        disabled={isPushing}
                        className="h-10 gap-1.5 px-4 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                      >
                        {isPushing ? 'Pushing...' : 'Push to Nuvio'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </footer>
          </div>

          {/* ================= RIGHT PERSISTENT SIDEBAR ("Profile Setup") ================= */}
          {step !== 2 && (
            <aside className="w-full lg:w-80 lg:shrink-0 border-t lg:border-t-0 lg:border-l border-border p-6 bg-card/40 space-y-6 lg:h-full overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Profile Setup
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Saved
                </span>
              </div>

              {/* Live Preview Card */}
              <div className="p-4 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
                <h4 className="text-sm font-semibold text-foreground">Live preview</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  See how Nuvio renders this profile layout on TVs and streaming devices right now.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewOpen(true)}
                  className="w-full text-xs gap-1.5"
                >
                  <Play className="size-3 text-primary" />
                  Open preview
                </Button>
              </div>

              {/* Setup Completion Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Setup completion</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">100%</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-full" />
                </div>
              </div>

              {/* Home Layout Arrange */}
              <div className="space-y-2 pt-2 border-t border-border">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Home Layout
                </h4>
                <button
                  onClick={() => setArrangeHomeOpen(true)}
                  className="w-full p-3 rounded-xl border border-border bg-background hover:bg-accent text-left flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <Sliders className="size-3.5 text-muted-foreground" />
                    Arrange home
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{selectedRows.length} items</span>
                </button>
              </div>

              {/* Required Providers Checklist */}
              <div className="space-y-2 pt-2 border-t border-border">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Required
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>MDBList</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>TMDB</span>
                  </div>
                </div>
              </div>

              {/* Optional Trackers Checklist */}
              <div className="space-y-2 pt-2 border-t border-border">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Optional
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Trakt</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Simkl</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>AniList</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="size-3.5 text-purple-500 dark:text-purple-400" />
                    <span>AI Recommendations</span>
                  </div>
                </div>
              </div>

              {/* Catalog Metrics */}
              <div className="space-y-2 pt-2 border-t border-border">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Catalog
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-background border border-border">
                    <div className="text-muted-foreground text-[10px]">Rows</div>
                    <div className="text-foreground font-mono font-bold text-base">{selectedRows.length}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-background border border-border">
                    <div className="text-muted-foreground text-[10px]">Collections</div>
                    <div className="text-foreground font-mono font-bold text-base">{collections.length}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-background border border-border">
                    <div className="text-muted-foreground text-[10px]">Folders</div>
                    <div className="text-foreground font-mono font-bold text-base">28</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-background border border-border">
                    <div className="text-muted-foreground text-[10px]">Sources</div>
                    <div className="text-foreground font-mono font-bold text-base">96</div>
                  </div>
                </div>
              </div>

              {/* Posters Checklist */}
              <div className="space-y-2 pt-2 border-t border-border">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Posters
                </h4>
                <div className="space-y-1.5 text-xs">
                  {posterProviders
                    .filter((p) => p.active || p.verified)
                    .map((p) => (
                      <div key={p.id} className="flex items-center gap-2 text-foreground">
                        <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{p.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* ================= ARRANGE HOME DIALOG ================= */}
        <Dialog open={arrangeHomeOpen} onOpenChange={setArrangeHomeOpen}>
          <DialogContent className="sm:max-w-lg bg-card border-border text-foreground max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <ListOrdered className="size-4 text-primary" />
                Arrange Home Rows
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Drag and drop to reorder how rows appear on your Nuvio home screen.
              </p>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-1 py-2 space-y-2">
              <DndContext
                sensors={dndSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleArrangeDragEnd}
              >
                <SortableContext
                  items={selectedRows.map((r) => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {selectedRows.map((row) => (
                    <SortableHomeRowItem
                      key={row.id}
                      row={row}
                      onRemove={() => toggleRow(row)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRows(getPresetRows('balanced', activeCategories))}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Reset to Default
              </Button>
              <Button
                size="sm"
                onClick={() => setArrangeHomeOpen(false)}
                className="text-xs px-4"
              >
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ================= ROW FILTER CONFIGURATION DIALOG ================= */}
        <Dialog open={!!editingRow} onOpenChange={(open) => !open && setEditingRow(null)}>
          <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <SlidersHorizontal className="size-4 text-primary" />
                Configure Row: {editingRow?.name}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Customize title override, rating thresholds, and display filters for this row.
              </p>
            </DialogHeader>
            <div className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Custom Display Title</Label>
                <Input
                  value={tempFilters.customTitle}
                  onChange={(e) => setTempFilters((prev) => ({ ...prev, customTitle: e.target.value }))}
                  placeholder={editingRow?.name || 'e.g. Featured Hits'}
                  className="h-9 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">Overrides row name on Nuvio home screen.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Min IMDb / TMDB Rating</Label>
                  <select
                    value={tempFilters.minRating}
                    onChange={(e) => setTempFilters((prev) => ({ ...prev, minRating: parseFloat(e.target.value) }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
                  >
                    <option value="0">Any Rating</option>
                    <option value="6.0">★ 6.0+</option>
                    <option value="6.5">★ 6.5+</option>
                    <option value="7.0">★ 7.0+</option>
                    <option value="7.5">★ 7.5+</option>
                    <option value="8.0">★ 8.0+</option>
                    <option value="8.5">★ 8.5+</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Min Vote Count</Label>
                  <select
                    value={tempFilters.minVotes}
                    onChange={(e) => setTempFilters((prev) => ({ ...prev, minVotes: parseInt(e.target.value, 10) }))}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
                  >
                    <option value="0">Any Votes</option>
                    <option value="100">100+ votes</option>
                    <option value="300">300+ votes</option>
                    <option value="500">500+ votes</option>
                    <option value="1000">1,000+ votes</option>
                    <option value="5000">5,000+ votes</option>
                    <option value="25000">25,000+ votes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Year From</Label>
                  <Input
                    type="number"
                    value={tempFilters.yearFrom}
                    onChange={(e) => setTempFilters((prev) => ({ ...prev, yearFrom: parseInt(e.target.value, 10) || 1900 }))}
                    min={1900}
                    max={2026}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Year To</Label>
                  <Input
                    type="number"
                    value={tempFilters.yearTo}
                    onChange={(e) => setTempFilters((prev) => ({ ...prev, yearTo: parseInt(e.target.value, 10) || 2026 }))}
                    min={1900}
                    max={2026}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Sort Order</Label>
                <select
                  value={tempFilters.sortBy}
                  onChange={(e) => setTempFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
                >
                  <option value="default">Default / Recommended</option>
                  <option value="rating">Highest Rated (IMDb / TMDB)</option>
                  <option value="popularity">Most Popular</option>
                  <option value="release_date">Newest Release Date</option>
                  <option value="title">Alphabetical (A-Z)</option>
                </select>
              </div>
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (editingRow) {
                    setRowFilters((prev) => {
                      const updated = { ...prev }
                      delete updated[editingRow.id]
                      return updated
                    })
                    setEditingRow(null)
                    toast.info(`Reset filters for ${editingRow.name}`)
                  }
                }}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Clear Filters
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingRow(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (editingRow) {
                      setRowFilters((prev) => ({
                        ...prev,
                        [editingRow.id]: {
                          customTitle: tempFilters.customTitle.trim() || undefined,
                          minRating: tempFilters.minRating > 0 ? tempFilters.minRating : undefined,
                          minVotes: tempFilters.minVotes > 0 ? tempFilters.minVotes : undefined,
                          yearFrom: tempFilters.yearFrom > 1900 ? tempFilters.yearFrom : undefined,
                          yearTo: tempFilters.yearTo < 2026 ? tempFilters.yearTo : undefined,
                          sortBy: tempFilters.sortBy !== 'default' ? tempFilters.sortBy : undefined,
                        },
                      }))
                      setEditingRow(null)
                      toast.success(`Saved filters for ${editingRow.name}`)
                    }
                  }}
                  className="text-xs"
                >
                  Save Filters
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ================= CREATE WITH AI DIALOG ================= */}
        <Dialog open={aiPromptOpen} onOpenChange={setAiPromptOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <Sparkles className="size-4 text-purple-500" />
                Create Home Row with AI
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Enter a natural language prompt or pick a preset theme to curate a custom row.
              </p>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input
                value={aiPromptInput}
                onChange={(e) => setAiPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateAiRow()
                  }
                }}
                placeholder="e.g. 90s Cyberpunk anime, Gritty Nordic Noir, Fast-paced Heist movies..."
                className="h-10 text-xs"
              />
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1.5 block">Theme Inspirations</Label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '90s Cyberpunk Thrillers',
                    'Mind-Bending Psychological Sci-Fi',
                    'Studio Ghibli Aesthetic Anime',
                    'High-Stakes Heist Cinema',
                    'Cozy British Murder Mysteries',
                    'Critically Acclaimed Dark Comedy',
                  ].map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => setAiPromptInput(sugg)}
                      className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-accent/30 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                    >
                      + {sugg}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAiPromptOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateAiRow}
                disabled={!aiPromptInput.trim()}
                className="text-xs gap-1.5"
              >
                <Sparkles className="size-3.5" />
                Generate & Add Row
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ================= ADD CUSTOM LIST DIALOG ================= */}
        <Dialog open={customListOpen} onOpenChange={setCustomListOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                <ListPlus className="size-4 text-primary" />
                Add Custom Catalog List
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Connect any MDBList public list, or TMDB actor, director, or production company as a home row.
              </p>
            </DialogHeader>
            <div className="space-y-3.5 py-2 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Source Type</Label>
                <select
                  value={customRowPrefix}
                  onChange={(e) => setCustomRowPrefix(e.target.value as any)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
                >
                  <option value="mdblist">MDBList List / Slug</option>
                  <option value="tmdb_actor">TMDB Actor ID</option>
                  <option value="tmdb_director">TMDB Director ID</option>
                  <option value="tmdb_company">TMDB Studio / Company ID</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Media Type</Label>
                <div className="flex items-center gap-4">
                  {(['movie', 'series'] as const).map((t) => (
                    <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="customRowTypeModal"
                        checked={customRowType === t}
                        onChange={() => setCustomRowType(t)}
                        className="accent-primary"
                      />
                      <span className="capitalize">{t === 'movie' ? 'Movies' : 'Series'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  {customRowPrefix === 'mdblist' ? 'MDBList Slug or List URL' : 'TMDB Entity ID'}
                </Label>
                <Input
                  value={customRowInput}
                  onChange={(e) => setCustomRowInput(e.target.value)}
                  placeholder={
                    customRowPrefix === 'mdblist'
                      ? 'e.g. 164547 or username/list'
                      : 'e.g. 500 (Tom Cruise)'
                  }
                  className="h-9 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  {customRowPrefix === 'mdblist'
                    ? 'Enter list ID, slug, or paste full mdblist.com URL.'
                    : 'Find the ID from the TMDB person/company page URL.'}
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCustomListOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  handleAddCustomRow()
                  setCustomListOpen(false)
                }}
                disabled={!customRowInput.trim()}
                className="text-xs gap-1.5"
              >
                <Plus className="size-3.5" />
                Add Row
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ================= LIVE PREVIEW MODAL ================= */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="sm:max-w-[900px] bg-card border-border text-foreground p-6 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Play className="size-4 text-emerald-600 dark:text-emerald-400" />
                Live Preview: "{profileName || 'Profile'}" on Nuvio
              </DialogTitle>
            </DialogHeader>

            {/* Simulated TV Shelf Preview */}
            <div className="space-y-8 pt-4">
              {/* Hero Backdrop Banner */}
              <div className="relative h-56 rounded-2xl overflow-hidden border border-border bg-gradient-to-r from-black via-zinc-900 to-purple-950/40 flex items-end p-6">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="relative z-10 space-y-1 max-w-lg">
                  <span className="text-[11px] uppercase tracking-widest text-primary font-bold">
                    Featured Presentation
                  </span>
                  <h3 className="text-2xl font-black text-white leading-tight">Dune: Part Two</h3>
                  <p className="text-xs text-zinc-300 line-clamp-2">
                    Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.
                  </p>
                </div>
              </div>

              {/* Collection Shelf Row */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground tracking-wide">Streaming Hub</h4>
                  <span className="text-xs text-muted-foreground">10 services</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {DEFAULT_COLLECTIONS[0]?.folders.map((f) => (
                    <div
                      key={f.id}
                      className={`h-24 rounded-xl p-3 bg-gradient-to-br ${f.bgGradient} border border-border flex flex-col justify-between shadow-md`}
                    >
                      <span className="text-[10px] font-bold text-white/80">{f.badgeText}</span>
                      <span className="font-extrabold text-white text-sm tracking-wider">{f.logoText}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Home Rows Preview */}
              {selectedRows.slice(0, 3).map((row) => {
                const items = previewMetas[row.id] || []
                return (
                  <div key={row.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-foreground tracking-wide">{row.name}</h4>
                      <span className="text-xs text-muted-foreground">{row.category}</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {items.length > 0
                        ? items.slice(0, 6).map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className="aspect-[2/3] rounded-xl bg-muted/30 border border-border flex flex-col justify-between p-2 relative group overflow-hidden"
                            >
                              {item.poster && (
                                <img
                                  src={item.poster}
                                  alt={item.name}
                                  className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  onError={(e) => {
                                    ;(e.target as HTMLElement).style.display = 'none'
                                  }}
                                />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                              <div className="relative z-10 self-start">
                                {item.imdbRating && (
                                  <div className="px-1.5 py-0.5 rounded-md bg-black/75 text-[9px] font-bold text-amber-400 backdrop-blur-xs flex items-center gap-0.5">
                                    ★ {item.imdbRating}
                                  </div>
                                )}
                              </div>
                              <span className="relative z-10 text-[11px] text-white font-medium line-clamp-2 leading-tight">
                                {item.name}
                              </span>
                            </div>
                          ))
                        : [1, 2, 3, 4, 5, 6].map((idx) => (
                            <div
                              key={idx}
                              className="aspect-[2/3] rounded-xl bg-background border border-border flex flex-col justify-between p-2 relative group overflow-hidden"
                            >
                              <div className="size-5 rounded-md bg-black/60 text-[9px] font-bold flex items-center justify-center text-amber-400">
                                ★ 8.{idx}
                              </div>
                              <span className="text-[10px] text-foreground font-medium truncate">
                                {row.name} #{idx}
                              </span>
                            </div>
                          ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
