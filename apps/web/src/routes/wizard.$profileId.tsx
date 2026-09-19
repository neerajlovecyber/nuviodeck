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
} from '@/data/catalog-data'

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
  const [aiProvider, setAiProvider] = React.useState('Google Gemini')
  const [aiApiKey, setAiApiKey] = React.useState('AIzaSyD-sample-verified-key')
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
  const [excludedGenres, setExcludedGenres] = React.useState<string[]>([])
  const [animeEpisodeOrdering, setAnimeEpisodeOrdering] = React.useState('TheTVDB')

  // Expanded cards in Setup
  const [openSection, setOpenSection] = React.useState<string | null>('integrations')

  // Step 2: Home rows State
  const [catalogSearch, setCatalogSearch] = React.useState('')
  const [expandedCategories, setExpandedCategories] = React.useState<string[]>([
    'ai',
    'trending',
    'streaming',
  ])
  const [selectedRows, setSelectedRows] = React.useState<CatalogItem[]>([
    { id: 'ai-movies', name: 'AI for you - Movies', category: 'AI generated', type: 'movie', isAi: true },
    { id: 'ai-series', name: 'AI for you - Series', category: 'AI generated', type: 'series', isAi: true },
    { id: 'rec-series', name: 'Recommended For You - Series', category: 'Trending', type: 'series' },
    { id: 'rec-movies', name: 'Recommended For You - Movies', category: 'Trending', type: 'movie' },
    { id: 'foryou-movies', name: 'For You - Movies', category: 'Trending', type: 'movie' },
    { id: 'foryou-series', name: 'For You - Series', category: 'Trending', type: 'series' },
    { id: 'trend-anime-series', name: 'Trending Anime - Series', category: 'Anime', type: 'series' },
    { id: 'trend-anime-movies', name: 'Trending Anime - Movies', category: 'Anime', type: 'movie' },
    { id: 'trend-series', name: 'Trending - Series', category: 'Trending', type: 'series' },
    { id: 'trend-movies', name: 'Trending - Movies', category: 'Trending', type: 'movie' },
    { id: 'popular-movies', name: 'Popular Movies This Week', category: 'Trending', type: 'movie' },
    { id: 'top10-netflix', name: 'Netflix Top 10 Today', category: 'Streaming Top 10', type: 'both' },
    { id: 'genre-scifi', name: 'Sci-Fi & Cyberpunk Visions', category: 'Genres', type: 'both' },
    { id: 'studio-a24', name: 'A24 Film Collection', category: 'Studios', type: 'movie' },
  ])

  // Step 3: Collections State
  const [collections, setCollections] = React.useState<CollectionConfig[]>(DEFAULT_COLLECTIONS)

  // Step 4: Finalize State
  const [sessions, setSessions] = React.useState<any[]>([])
  const [isPushing, setIsPushing] = React.useState(false)

  // Live preview modal
  const [previewOpen, setPreviewOpen] = React.useState(false)

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
              if (cfg.rows) setSelectedRows(cfg.rows)
              if (cfg.collections) setCollections(cfg.collections)
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
          scrobbleTrakt,
          scrobbleSimkl,
          scrobbleAniList,
          playbackEndRule,
        },
        ai: {
          provider: aiProvider,
          apiKey: aiApiKey,
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
                          className="font-mono text-xs"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Your Trakt watch history and MDBList list names are sent to Google Gemini to generate custom recommendations. Nothing is sent until you select an AI row.
                        </p>
                      </div>

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
                        <p className="text-xs text-muted-foreground mt-0.5">English · Automatic (source air date)</p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`size-4 text-muted-foreground transition-transform ${
                        openSection === 'preferences' ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  {openSection === 'preferences' && (
                    <div className="px-5 pb-6 pt-2 border-t border-border/60 space-y-4 text-xs">
                      <div className="space-y-2.5">
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
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => {
                          const items = CATALOG_CATEGORIES.flatMap((c) => c.items).slice(0, 16)
                          setSelectedRows(items)
                          toast.success('Applied Everyday Mix preset')
                        }}
                      >
                        Everyday Mix
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const movies = CATALOG_CATEGORIES.flatMap((c) => c.items).filter((i) => i.type === 'movie').slice(0, 18)
                          setSelectedRows(movies)
                          toast.success('Applied Cinephile preset')
                        }}
                      >
                        Cinephile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          const series = CATALOG_CATEGORIES.flatMap((c) => c.items).filter((i) => i.type === 'series').slice(0, 16)
                          setSelectedRows(series)
                          toast.success('Applied TV Marathon preset')
                        }}
                      >
                        TV Marathon
                      </DropdownMenuItem>
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
                      {CATALOG_CATEGORIES.map((cat) => {
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
              {selectedRows.slice(0, 3).map((row) => (
                <div key={row.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground tracking-wide">{row.name}</h4>
                    <span className="text-xs text-muted-foreground">{row.category}</span>
                  </div>
                  <div className="grid grid-cols-6 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((idx) => (
                      <div
                        key={idx}
                        className="aspect-[2/3] rounded-xl bg-background border border-border flex flex-col justify-between p-2 relative group overflow-hidden"
                      >
                        <div className="size-5 rounded-md bg-black/60 text-[9px] font-bold flex items-center justify-center text-amber-400">
                          ★ 8.{idx}
                        </div>
                        <span className="text-[10px] text-foreground font-medium truncate">
                          Title #{idx}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
