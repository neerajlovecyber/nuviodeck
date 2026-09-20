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
} from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { Checkbox } from '@workspace/ui/components/checkbox'
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

export const Route = createFileRoute('/wizard/$profileId')({
  component: ProfileWizardPage,
})

function ProfileWizardPage() {
  const { profileId } = Route.useParams()
  const navigate = useNavigate()

  // Wizard state
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1)
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

  // Step 3: Collections State
  const [collections, setCollections] = React.useState<CollectionConfig[]>(DEFAULT_COLLECTIONS)

  // Step 4: Finalize State
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
          showRatingsOnPosters,
          ratingBadgedStills,
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
      <SidebarInset className="bg-background text-foreground min-h-screen flex flex-col">
        {/* Unified Top Header Bar */}
        <header className="flex h-(--header-height) shrink-0 items-center justify-between gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) px-4 lg:px-6 bg-background/95 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-1 h-4" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: '/dashboard' })}
              className="h-8 w-8 rounded-lg"
              title="Back to Profiles"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-sm font-semibold text-foreground leading-tight">
                {profileName || 'New Profile'}
              </h1>
              <p className="text-[11px] text-muted-foreground font-normal">Step {step} of 4</p>
            </div>
          </div>

          {/* Stepper Center Indicator */}
          <div className="hidden md:flex items-center gap-3 text-sm">
            {[
              { num: 1, label: 'Setup' },
              { num: 2, label: 'Home rows' },
              { num: 3, label: 'Collections' },
              { num: 4, label: 'Finalize' },
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <button
                  onClick={() => {
                    saveProfileConfig()
                    setStep(s.num as any)
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    step === s.num
                      ? 'bg-accent text-accent-foreground border border-border shadow-xs'
                      : step > s.num
                      ? 'text-foreground/80 hover:text-foreground'
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
                  <span>{s.label}</span>
                </button>
                {idx < 3 && <div className="w-6 h-px bg-border" />}
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewOpen(true)}
              className="text-xs gap-1.5 h-8"
            >
              <Play className="size-3 text-primary" />
              Preview
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Main Grid: Content (Center) + Persistent Sidebar (Right) */}
        <div className="flex-1 flex flex-col lg:flex-row w-full min-h-0">
          {/* Center Work Area */}
          <div className="flex-1 min-w-0 flex flex-col items-center">
            <div className="w-full max-w-4xl lg:max-w-5xl px-6 py-8 md:px-10 lg:px-12">
            {/* ================= STEP 1: SETUP ================= */}
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in-50 duration-200">
                <div>
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">Setup</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Name your profile and connect the catalog providers.
                  </p>
                </div>

                {/* Profile Name Card */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prof-name" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      Profile name
                      <Info className="size-3.5 text-muted-foreground" />
                    </Label>
                  </div>
                  <Input
                    id="prof-name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g. Cinema 4K, Late-night vibes"
                    className="h-11 text-sm"
                  />
                </div>

                {/* Integrations Drawer Card */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden transition-all">
                  <div
                    onClick={() => setOpenSection(openSection === 'integrations' ? null : 'integrations')}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="size-9 rounded-xl bg-accent flex items-center justify-center text-foreground">
                        <Key className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Integrations</h3>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Both keys verified. You can continue.</p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`size-4 text-muted-foreground transition-transform duration-200 ${
                        openSection === 'integrations' ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  {openSection === 'integrations' && (
                    <div className="px-5 pb-6 pt-2 border-t border-border/60 space-y-6 text-sm">
                      {/* MDBList */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">MDBList Key</span>
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
                          <span className="font-medium text-foreground">TMDB Read Access Token</span>
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
                </div>

                {/* AI Recommendations Card */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div
                    onClick={() => setOpenSection(openSection === 'ai' ? null : 'ai')}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="size-9 rounded-xl bg-accent flex items-center justify-center text-foreground">
                        <Sparkles className="size-4 text-purple-500 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">AI Recommendations</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{aiProvider}</p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`size-4 text-muted-foreground transition-transform ${
                        openSection === 'ai' ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  {openSection === 'ai' && (
                    <div className="px-5 pb-6 pt-2 border-t border-border/60 space-y-4 text-sm">
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
                </div>

                {/* Search Card */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div
                    onClick={() => setOpenSection(openSection === 'search' ? null : 'search')}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="size-9 rounded-xl bg-accent flex items-center justify-center text-foreground">
                        <Search className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Search</h3>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{searchEnabled ? 'On' : 'Off'}</p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`size-4 text-muted-foreground transition-transform ${
                        openSection === 'search' ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  {openSection === 'search' && (
                    <div className="px-5 pb-6 pt-2 border-t border-border/60 space-y-3 text-xs">
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
                </div>

                {/* Discover Card */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div
                    onClick={() => setOpenSection(openSection === 'discover' ? null : 'discover')}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="size-9 rounded-xl bg-accent flex items-center justify-center text-foreground">
                        <Compass className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Discover</h3>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{discoverEnabled ? 'On' : 'Off'}</p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`size-4 text-muted-foreground transition-transform ${
                        openSection === 'discover' ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  {openSection === 'discover' && (
                    <div className="px-5 pb-6 pt-2 border-t border-border/60 space-y-3 text-xs">
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
                </div>

                {/* Streams Informational Notice Card */}
                <div className="rounded-2xl border border-border bg-card p-5 flex items-start gap-4">
                  <div className="size-9 rounded-xl bg-accent flex items-center justify-center text-primary shrink-0">
                    <Radio className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-semibold text-foreground">Streams</h3>
                      <Info className="size-3 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Provide streams with a supporter membership. Serve streams from your own debrid service alongside your catalogs.
                    </p>
                    <p className="text-[11px] text-primary mt-2 font-medium">
                      Stream provider addons run as dedicated integrations separate from this catalog profile.
                    </p>
                  </div>
                </div>

                {/* Posters Card */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div
                    onClick={() => setOpenSection(openSection === 'posters' ? null : 'posters')}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="size-9 rounded-xl bg-accent flex items-center justify-center text-foreground">
                        <ImageIcon className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Posters</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Custom URL, BetterPosters, EasyRatings, Top Posters, RPDB</p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`size-4 text-muted-foreground transition-transform ${
                        openSection === 'posters' ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  {openSection === 'posters' && (
                    <div className="px-5 pb-6 pt-2 border-t border-border/60 space-y-3 text-xs">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2">
                        {[
                          { name: 'BetterPosters', status: 'verified' },
                          { name: 'EasyRatings', status: 'verified' },
                          { name: 'Top Posters', status: 'verified' },
                          { name: 'RPDB', status: 'verified' },
                          { name: 'OMDb', status: 'not in use' },
                          { name: 'Fanart.tv', status: 'not in use' },
                        ].map((p) => (
                          <div key={p.name} className="p-2.5 rounded-lg bg-background border border-border flex items-center justify-between">
                            <span className="text-foreground">{p.name}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded ${
                                p.status === 'verified'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2 pt-2 border-t border-border/40">
                        <label className="flex items-center gap-2 text-foreground cursor-pointer">
                          <Checkbox checked={showRatingsOnPosters} onCheckedChange={(c) => setShowRatingsOnPosters(!!c)} />
                          <span>Show ratings on posters</span>
                        </label>
                        <label className="flex items-center gap-2 text-foreground cursor-pointer">
                          <Checkbox checked={ratingBadgedStills} onCheckedChange={(c) => setRatingBadgedStills(!!c)} />
                          <span>Rating-badged episode stills</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Preferences Card */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div
                    onClick={() => setOpenSection(openSection === 'preferences' ? null : 'preferences')}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="size-9 rounded-xl bg-accent flex items-center justify-center text-foreground">
                        <Sliders className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Preferences</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {POPULAR_LANGUAGES.find((l) => l.code === language)?.name || language} · {selectedRegion} · {ageRating === 'NONE' ? 'All Ratings' : ageRating}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`size-4 text-muted-foreground transition-transform ${
                        openSection === 'preferences' ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  {openSection === 'preferences' && (
                    <div className="px-5 pb-6 pt-2 border-t border-border/60 space-y-5 text-xs">
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
                </div>
              </div>
            )}

            {/* ================= STEP 2: HOME ROWS ================= */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Home rows</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Pick rows for the Nuvio home screen. Suggested around 15. Reorder anytime with Arrange home.
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                          <Sparkles className="size-3.5 text-purple-500 dark:text-purple-400" />
                          Apply preset
                          <ChevronDown className="size-3 ml-1" />
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
                </div>

                {/* Counter progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">Home rows</span>
                    <span className="text-muted-foreground font-mono">{selectedRows.length} / 50</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (selectedRows.length / 50) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 2-Column Row Picker: Categories Accordion (Left) + Selected List (Right) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2">
                  {/* Left Column: Categories */}
                  <div className="md:col-span-6 space-y-3">
                    {/* Custom Dynamic Ad-Hoc Row Input */}
                    <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <Plus className="size-3.5 text-primary" />
                          <span>Add Custom Dynamic Row</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">MDBList · TMDB Person / Studio</span>
                      </div>
                      <div className="grid grid-cols-12 gap-2">
                        <select
                          value={customRowPrefix}
                          onChange={(e) => setCustomRowPrefix(e.target.value as any)}
                          className="col-span-5 h-8 rounded-lg border border-input bg-background px-2 text-xs"
                        >
                          <option value="mdblist">MDBList List / Slug</option>
                          <option value="tmdb_actor">TMDB Actor ID</option>
                          <option value="tmdb_director">TMDB Director ID</option>
                          <option value="tmdb_company">TMDB Studio ID</option>
                        </select>
                        <select
                          value={customRowType}
                          onChange={(e) => setCustomRowType(e.target.value as any)}
                          className="col-span-3 h-8 rounded-lg border border-input bg-background px-2 text-xs"
                        >
                          <option value="movie">Movies</option>
                          <option value="series">Series</option>
                        </select>
                        <Input
                          value={customRowInput}
                          onChange={(e) => setCustomRowInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddCustomRow()
                            }
                          }}
                          placeholder={
                            customRowPrefix === 'mdblist'
                              ? 'e.g. 164547 or username/list'
                              : 'e.g. 500 (Tom Cruise)'
                          }
                          className="col-span-4 h-8 text-xs px-2.5"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={handleAddCustomRow}
                          className="h-7 text-xs px-3 gap-1"
                        >
                          <Plus className="size-3" />
                          Add Row
                        </Button>
                      </div>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        placeholder="Search catalogs..."
                        className="pl-9 text-xs h-10"
                      />
                    </div>

                    {/* Categories Accordion */}
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                      {activeCategories.map((cat) => {
                        const isExpanded = expandedCategories.includes(cat.id)
                        const filteredItems = cat.items.filter((i) =>
                          i.name.toLowerCase().includes(catalogSearch.toLowerCase())
                        )
                        if (catalogSearch && filteredItems.length === 0) return null

                        const selectedCount = cat.items.filter((i) =>
                          selectedRows.some((r) => r.id === i.id)
                        ).length

                        return (
                          <div key={cat.id} className="rounded-xl border border-border bg-card overflow-hidden">
                            <div
                              onClick={() => toggleCategory(cat.id)}
                              className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-accent/40 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-foreground tracking-wide">
                                  {cat.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-muted-foreground font-mono">
                                  {selectedCount} / {cat.items.length}
                                </span>
                                <ChevronRight
                                  className={`size-3.5 text-muted-foreground transition-transform ${
                                    isExpanded ? 'rotate-90' : ''
                                  }`}
                                />
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="px-3 pb-3 pt-1 border-t border-border/40 space-y-1">
                                {filteredItems.map((item) => {
                                  const isSelected = selectedRows.some((r) => r.id === item.id)
                                  return (
                                    <div
                                      key={item.id}
                                      onClick={() => toggleRow(item)}
                                      className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer text-xs transition-colors ${
                                        isSelected
                                          ? 'bg-primary/10 border border-primary/30 text-foreground'
                                          : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 truncate pr-2">
                                        <Checkbox checked={isSelected} />
                                        <span className="truncate">{item.name}</span>
                                      </div>
                                      <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                                        {item.category}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Right Column: Selected Rows */}
                  <div className="md:col-span-6 rounded-2xl border border-border bg-card p-4 flex flex-col h-[650px]">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground">Selected</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {selectedRows.length} / 15 suggested
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRows([])}
                        className="text-xs h-7 px-2 text-muted-foreground hover:text-destructive"
                      >
                        Clear
                      </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1">
                      {selectedRows.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                          <Layers className="size-8 stroke-1 mb-2" />
                          <p className="text-xs">No home rows selected yet</p>
                          <p className="text-[11px] text-muted-foreground/70 mt-1">Pick categories on the left to add rows</p>
                        </div>
                      ) : (
                        selectedRows.map((row, idx) => (
                          <div
                            key={row.id}
                            className="p-3 rounded-xl border border-border bg-background flex items-center justify-between group hover:border-border/80 transition-all"
                          >
                            <div className="flex items-center gap-2.5 truncate pr-2">
                              <span className="size-5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div className="truncate">
                                <div className="text-xs font-medium text-foreground truncate">{row.name}</div>
                                <div className="text-[10px] text-muted-foreground">{row.category}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => toggleRow(row)}
                                className="size-6 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
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
                          <h3 className="text-base font-bold text-foreground">{col.name}</h3>
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
                          {(['Poster', 'Landscape', 'Square'] as const).map((shape) => (
                            <label key={shape} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                              <input
                                type="radio"
                                name={`shape-${col.id}`}
                                checked={col.tileShape === shape}
                                onChange={() => {
                                  setCollections((prev) =>
                                    prev.map((c) => (c.id === col.id ? { ...c, tileShape: shape } : c))
                                  )
                                }}
                                className="accent-primary"
                              />
                              <span>{shape}</span>
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
                            <Checkbox checked={col.pinToTop} />
                          </div>
                          <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
                            <span className="text-xs text-foreground">Focus glow</span>
                            <Checkbox checked={col.focusGlow} />
                          </div>
                          <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
                            <span className="text-xs text-foreground">"All" tab</span>
                            <Checkbox checked={col.allTab} />
                          </div>
                        </div>
                      </div>

                      {/* View mode */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-semibold">View mode</Label>
                        <div className="grid grid-cols-3 gap-2 p-1 bg-background rounded-xl border border-border">
                          {(['Follow layout', 'Rows', 'Tabbed grid'] as const).map((vm) => (
                            <button
                              key={vm}
                              type="button"
                              onClick={() => {
                                setCollections((prev) =>
                                  prev.map((c) => (c.id === col.id ? { ...c, viewMode: vm } : c))
                                )
                              }}
                              className={`py-2 rounded-lg text-xs font-medium transition-all ${
                                col.viewMode === vm ? 'bg-accent text-accent-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {vm}
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

            {/* ================= STEP 4: FINALIZE ================= */}
            {step === 4 && (
              <div className="space-y-8 animate-in fade-in-50 duration-200 py-4">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="size-14 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 className="size-8" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                    {profileName || 'Profile'} is ready
                  </h2>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedRows.length} home rows · {collections.length} collections · 28 folders · 96 sources · Language English
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
                        One click installs the add-on and pushes your collections and catalog manifests directly to your Nuvio profile.
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-accent border border-border text-foreground">
                          Add-on: {selectedRows.length} home rows
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-accent border border-border text-foreground">
                          Collections: {collections.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={handlePushToNuvio}
                      disabled={isPushing}
                      className="w-full h-12 rounded-xl font-semibold text-base shadow-lg transition-all flex items-center justify-center gap-2"
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
                      className="h-10 px-3 text-xs gap-1.5 shrink-0"
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

            {/* Bottom Persistent Step Navigation */}
            <div className="pt-10 pb-6 border-t border-border mt-10 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  if (step > 1) setStep((step - 1) as any)
                  else navigate({ to: '/dashboard' })
                }}
                className="text-xs px-5"
              >
                &lt; Back
              </Button>

              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {step === 1 && 'Next: Home rows'}
                  {step === 2 && 'Next: Collections'}
                  {step === 3 && 'Next: Finalize'}
                  {step === 4 && 'Complete'}
                </span>

                {step < 4 ? (
                  <Button
                    onClick={() => {
                      saveProfileConfig()
                      setStep((step + 1) as any)
                    }}
                    className="font-semibold text-xs px-6"
                  >
                    Continue &gt;
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate({ to: '/dashboard' })}
                    className="font-semibold text-xs px-6"
                  >
                    Return to Dashboard
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

          {/* ================= RIGHT PERSISTENT SIDEBAR ("Profile Setup") ================= */}
          <aside className="w-full lg:w-80 lg:shrink-0 border-t lg:border-t-0 lg:border-l border-border p-6 bg-card/40 space-y-6 lg:sticky lg:top-(--header-height) lg:h-[calc(100vh-var(--header-height))] lg:overflow-y-auto">
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
                onClick={() => setStep(2)}
                className="w-full p-3 rounded-xl border border-border bg-background hover:bg-accent text-left flex items-center justify-between transition-colors"
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
                {['Custom URL', 'BetterPosters', 'EasyRatings', 'Top Posters', 'RPDB'].map((p) => (
                  <div key={p} className="flex items-center gap-2 text-foreground">
                    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

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
