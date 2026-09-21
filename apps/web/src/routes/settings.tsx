import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import {
  SidebarInset,
  SidebarProvider,
} from '@workspace/ui/components/sidebar'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { Switch } from '@workspace/ui/components/switch'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { RadioGroup, RadioGroupItem } from '@workspace/ui/components/radio-group'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@workspace/ui/components/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog'
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
import {
  CircleCheck,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  Info,
  GripVertical,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  Trash2,
  Link2,
  Link2Off,
  Globe,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/store/useStore'
import { useSettingsStore, PosterProvider } from '@/store/useSettingsStore'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

// Brand SVG Logos
function NuvioLogo({ className = 'size-8' }: { className?: string }) {
  return (
    <div className={`grid place-items-center rounded-lg bg-primary/15 text-primary p-1.5 ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-full">
        <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" fillOpacity="0.3" />
      </svg>
    </div>
  )
}

function TmdbLogo({ className = 'size-8' }: { className?: string }) {
  return (
    <div className={`grid place-items-center rounded-lg bg-[#0d253f] text-[#01b4e4] p-1 font-black text-xs tracking-tighter ${className}`}>
      TMDB
    </div>
  )
}

function TraktLogo({ className = 'size-8' }: { className?: string }) {
  return (
    <div className={`grid place-items-center rounded-lg bg-[#ed1c24] text-white p-1 font-black text-xs ${className}`}>
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
      </svg>
    </div>
  )
}

function SimklLogo({ className = 'size-8' }: { className?: string }) {
  return (
    <div className={`grid place-items-center rounded-lg bg-[#000] text-[#00e676] border border-border p-1 font-bold text-xs ${className}`}>
      SIMKL
    </div>
  )
}

function AniListLogo({ className = 'size-8' }: { className?: string }) {
  return (
    <div className={`grid place-items-center rounded-lg bg-[#02A9FF] text-white p-1 font-bold text-xs ${className}`}>
      AL
    </div>
  )
}

function MalLogo({ className = 'size-8' }: { className?: string }) {
  return (
    <div className={`grid place-items-center rounded-lg bg-[#2e51a2] text-white p-1 font-black text-xs ${className}`}>
      MAL
    </div>
  )
}

// Info Descriptions Directory for Tooltips / Sheet
const INFO_DESCRIPTIONS: Record<string, { title: string; description: string; detail?: string }> = {
  'mdblist-scrobble': {
    title: 'Scrobble now watching to MDBList',
    description:
      'When you play a title in your player, your currently watching status is automatically sent to your MDBList profile.',
    detail: 'Helps keep your watch lists and recommendation metrics synced with your real-time viewing activity.',
  },
  'fallback-language': {
    title: 'Fallback language',
    description:
      'Used for titles, descriptions, and episode overviews whenever metadata is missing in your primary selected language.',
    detail: 'Ensures no fields are left blank when browsing international or newly indexed catalog items.',
  },
  timezone: {
    title: 'Timezone',
    description: 'Determines how release dates and air times are formatted and calculated.',
    detail:
      'Setting to "Automatic" keeps dates synchronized with the original broadcaster air date without timezone shifting.',
  },
  'series-source': {
    title: 'Series season & episode source',
    description: 'Selects the canonical provider for television show seasons, numbering, and episode air orders.',
    detail: 'TheTVDB is recommended for optimal stream mapping and torrent numbering compatibility.',
  },
  'anime-source': {
    title: 'Anime season & episode source',
    description: 'Determines whether anime seasons are grouped according to Japanese broadcast arcs or TMDB seasons.',
  },
  'anime-numbering': {
    title: 'Anime episode numbering',
    description:
      'Choose between Absolute numbering (e.g. Episode 1045) or standard Season/Episode format (S02E15).',
  },
  'filler-episodes': {
    title: 'Filler episodes',
    description: 'Control whether community-flagged anime filler episodes are tagged, hidden, or left as normal episodes.',
  },
  'anime-stream-id': {
    title: 'Anime stream ID',
    description: 'Specifies which identification convention (IMDb, Kitsu, AniList) is queried when scraping streams.',
  },
  'anime-titles': {
    title: 'Anime titles',
    description: 'Choose whether anime titles display in English, Romaji (e.g. Boku no Hero Academia), or Native Kanji.',
  },
  'quality-floor': {
    title: 'Quality floor',
    description:
      'Sets a rating and vote threshold for catalog generation to filter out low-quality or irrelevant items.',
  },
  'origin-countries': {
    title: 'Origin countries',
    description: 'Filter catalog rows to prioritize titles originating from selected countries or production regions.',
  },
  'exclude-countries': {
    title: 'Exclude countries',
    description: 'Exclude titles produced in selected countries from all generated catalog rows.',
  },
}

// Sortable Item Component for Poster Providers
function SortablePosterItem({
  provider,
  showKey,
  toggleShowKey,
  onKeyChange,
  onVerify,
}: {
  provider: PosterProvider
  showKey: boolean
  toggleShowKey: () => void
  onKeyChange: (val: string) => void
  onVerify: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: provider.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 20 : 1,
  }

  const [expanded, setExpanded] = React.useState(false)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg p-3 border transition-colors ${
        provider.active
          ? 'bg-card border-border'
          : 'border-dashed bg-card/40 opacity-75'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="relative grid h-6 w-7 shrink-0 cursor-grab touch-none place-items-center self-start rounded-md text-muted-foreground/70 transition-colors hover:text-foreground active:cursor-grabbing"
        aria-label={`Drag to reorder: ${provider.name}`}
      >
        <GripVertical className="size-4" />
      </button>

      <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2">
        <div className="flex min-h-6 flex-wrap items-center gap-2">
          <Label className="text-sm font-semibold leading-none">{provider.name}</Label>
          {provider.linkUrl && (
            <a
              href={provider.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-xs whitespace-nowrap text-primary underline-offset-4 hover:underline"
            >
              {provider.linkText || 'Configure'}{' '}
              <ExternalLink className="size-3 shrink-0" />
            </a>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {provider.verified ? (
              <span className="inline-flex h-5 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CircleCheck className="size-3 shrink-0" /> verified
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">not in use</span>
            )}
          </div>
        </div>

        <div className="flex min-h-6 items-center justify-end">
          {provider.hasConfig && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-label={`Options for ${provider.name}`}
              className="relative grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              <ChevronDown
                className={`size-4 transition-transform duration-200 ${
                  expanded ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}
        </div>

        <div className="relative min-w-0">
          <Input
            type={showKey ? 'text' : 'password'}
            placeholder={provider.placeholder}
            value={provider.key}
            onChange={(e) => onKeyChange(e.target.value)}
            className="h-9 pr-10 text-sm"
          />
          <button
            type="button"
            onClick={toggleShowKey}
            aria-label={`Show ${provider.name} key`}
            className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onVerify}
          className="h-9 shrink-0 gap-1 rounded-lg px-2.5 text-xs font-medium"
        >
          Verify
        </Button>

        {expanded && (
          <div className="col-span-2 pt-2 border-t mt-1 text-xs text-muted-foreground">
            <p>Custom formatting and caching rules can be configured directly with BetterPosters provider.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SettingsPage() {
  const { theme, toggleTheme } = useAppStore()
  const {
    apiKeys,
    setApiKey,
    posterProviders,
    setPosterProviders,
    updatePosterProviderKey,
    showRatingsOnPosters,
    setShowRatingsOnPosters,
    badgedEpisodeStills,
    setBadgedEpisodeStills,
    profileDefaults,
    setProfileDefault,
    appLanguage,
    setAppLanguage,
    playbackCompletion,
    setPlaybackCompletion,
    connections,
    setConnection,
  } = useSettingsStore()

  // Password Visibility States
  const [showMdb, setShowMdb] = React.useState(false)
  const [showTmdb, setShowTmdb] = React.useState(false)
  const [showGemini, setShowGemini] = React.useState(false)
  const [showGroq, setShowGroq] = React.useState(false)
  const [showDeepseek, setShowDeepseek] = React.useState(false)
  const [showLetterboxd, setShowLetterboxd] = React.useState(false)
  const [providerKeyVisibility, setProviderKeyVisibility] = React.useState<Record<string, boolean>>({})

  // Sheet State for Info
  const [infoSheetKey, setInfoSheetKey] = React.useState<string | null>(null)

  // Dialog State for Delete Account
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  // Setup DnD for Posters
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = posterProviders.findIndex((p) => p.id === active.id)
      const newIndex = posterProviders.findIndex((p) => p.id === over.id)
      setPosterProviders(arrayMove(posterProviders, oldIndex, newIndex))
      toast.success('Poster provider order updated')
    }
  }

  const handleVerify = (name: string) => {
    toast.success(`${name} verified successfully`)
  }

  const handleApplyToAll = (sectionName: string) => {
    toast.success(`Applied ${sectionName} to all existing profiles`)
  }

  const openInfo = (key: string) => {
    setInfoSheetKey(key)
  }

  const activeInfo = infoSheetKey ? INFO_DESCRIPTIONS[infoSheetKey] : null

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
      <SidebarInset>
        <SiteHeader />

        <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 md:px-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Global defaults, API keys, poster providers, and account integrations.
            </p>
          </div>

          <div className="flex flex-col gap-5 sm:gap-6">
            {/* 1. Default API keys */}
            <section className="flex flex-col gap-5 rounded-xl border bg-card p-4 sm:p-6 shadow-xs">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Default API keys</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Entered once and copied into every new profile you create.
                </p>
              </div>

              {/* MDBList */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Label htmlFor="default-mdblist" className="text-sm font-medium">
                    MDBList API key <span className="text-destructive">*</span>
                  </Label>
                  <a
                    href="https://mdblist.com/preferences/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                  >
                    Get a key <ExternalLink className="size-3" />
                  </a>
                  <span className="inline-flex h-5 max-w-full items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 sm:ml-auto">
                    <CircleCheck className="size-3 shrink-0" />
                    <span className="min-w-0 truncate">{apiKeys.mdblist || 'Verified'}</span>
                  </span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Input
                      id="default-mdblist"
                      type={showMdb ? 'text' : 'password'}
                      value={apiKeys.mdblist}
                      onChange={(e) => setApiKey('mdblist', e.target.value)}
                      className="h-11 pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMdb(!showMdb)}
                      aria-label="Show key"
                      className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showMdb ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleVerify('MDBList')}
                    className="h-11 shrink-0 px-4 text-sm font-medium"
                  >
                    Verify
                  </Button>
                </div>
              </div>

              {/* MDBList Scrobble */}
              <div className="flex flex-col gap-3 border-b pb-5">
                <div className="flex items-center gap-3">
                  <Switch
                    id="default-mdblist-scrobble"
                    checked={apiKeys.mdblistScrobble}
                    onCheckedChange={(checked) => setApiKey('mdblistScrobble', Boolean(checked))}
                    aria-label="Scrobble now watching to MDBList"
                  />
                  <div className="flex min-h-5 items-center gap-1.5">
                    <Label htmlFor="default-mdblist-scrobble" className="cursor-pointer text-sm font-medium text-foreground">
                      Scrobble now watching to MDBList
                    </Label>
                    <button
                      type="button"
                      onClick={() => openInfo('mdblist-scrobble')}
                      aria-label="About Scrobble now watching to MDBList"
                      className="relative flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Info className="size-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <p className="min-w-0 text-xs text-muted-foreground">
                    Apply this MDBList scrobble setting to your existing profiles.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyToAll('MDBList scrobble')}
                    className="h-8 shrink-0 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
                  >
                    <RefreshCw className="size-3.5" /> Apply to profiles
                  </Button>
                </div>
              </div>

              {/* TMDB */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Label htmlFor="default-tmdb" className="text-sm font-medium">
                    TMDB API key <span className="text-destructive">*</span>
                  </Label>
                  <a
                    href="https://www.themoviedb.org/settings/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                  >
                    Get a key <ExternalLink className="size-3" />
                  </a>
                  <span className="inline-flex h-5 max-w-full items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 sm:ml-auto">
                    <CircleCheck className="size-3 shrink-0" />
                    <span className="min-w-0 truncate">Verified</span>
                  </span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Input
                      id="default-tmdb"
                      type={showTmdb ? 'text' : 'password'}
                      value={apiKeys.tmdb}
                      onChange={(e) => setApiKey('tmdb', e.target.value)}
                      className="h-11 pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTmdb(!showTmdb)}
                      aria-label="Show key"
                      className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showTmdb ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleVerify('TMDB')}
                    className="h-11 shrink-0 px-4 text-sm font-medium"
                  >
                    Verify
                  </Button>
                </div>
              </div>

              {/* Gemini */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Label htmlFor="default-gemini" className="text-sm font-medium">
                    Gemini API key
                  </Label>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                  >
                    Get a key <ExternalLink className="size-3" />
                  </a>
                  <span className="inline-flex h-5 max-w-full items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 sm:ml-auto">
                    <CircleCheck className="size-3 shrink-0" />
                    <span className="min-w-0 truncate">Gemini</span>
                  </span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Input
                      id="default-gemini"
                      type={showGemini ? 'text' : 'password'}
                      value={apiKeys.gemini}
                      onChange={(e) => setApiKey('gemini', e.target.value)}
                      className="h-11 pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGemini(!showGemini)}
                      aria-label="Show key"
                      className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showGemini ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleVerify('Gemini')}
                    className="h-11 shrink-0 px-4 text-sm font-medium"
                  >
                    Verify
                  </Button>
                </div>
              </div>

              {/* Groq */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Label htmlFor="default-groq" className="text-sm font-medium">
                    Groq API key
                  </Label>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                  >
                    Get a key <ExternalLink className="size-3" />
                  </a>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Input
                      id="default-groq"
                      type={showGroq ? 'text' : 'password'}
                      placeholder="gsk_..."
                      value={apiKeys.groq}
                      onChange={(e) => setApiKey('groq', e.target.value)}
                      className="h-11 pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGroq(!showGroq)}
                      aria-label="Show key"
                      className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showGroq ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    disabled={!apiKeys.groq.trim()}
                    onClick={() => handleVerify('Groq')}
                    className="h-11 shrink-0 px-4 text-sm font-medium"
                  >
                    Verify
                  </Button>
                </div>
              </div>

              {/* DeepSeek */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Label htmlFor="default-deepseek" className="text-sm font-medium">
                    DeepSeek API key
                  </Label>
                  <a
                    href="https://platform.deepseek.com/api_keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                  >
                    Get a key <ExternalLink className="size-3" />
                  </a>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Input
                      id="default-deepseek"
                      type={showDeepseek ? 'text' : 'password'}
                      placeholder="sk-..."
                      value={apiKeys.deepseek}
                      onChange={(e) => setApiKey('deepseek', e.target.value)}
                      className="h-11 pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeepseek(!showDeepseek)}
                      aria-label="Show key"
                      className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showDeepseek ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    disabled={!apiKeys.deepseek.trim()}
                    onClick={() => handleVerify('DeepSeek')}
                    className="h-11 shrink-0 px-4 text-sm font-medium"
                  >
                    Verify
                  </Button>
                </div>
              </div>

              {/* Letterboxd */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Label htmlFor="default-letterboxd" className="text-sm font-medium">
                    Letterboxd Username
                  </Label>
                  <a
                    href="https://letterboxd.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                  >
                    letterboxd.com <ExternalLink className="size-3" />
                  </a>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Input
                      id="default-letterboxd"
                      type={showLetterboxd ? 'text' : 'password'}
                      placeholder="username"
                      value={apiKeys.letterboxd}
                      onChange={(e) => setApiKey('letterboxd', e.target.value)}
                      className="h-11 pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLetterboxd(!showLetterboxd)}
                      aria-label="Show key"
                      className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showLetterboxd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <Button
                    variant="outline"
                    disabled={!apiKeys.letterboxd.trim()}
                    onClick={() => handleVerify('Letterboxd')}
                    className="h-11 shrink-0 px-4 text-sm font-medium"
                  >
                    Verify
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Optional. Your public Letterboxd username powers the “My Letterboxd Watchlist” row.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 border-t pt-4">
                <p className="min-w-0 text-xs text-muted-foreground">
                  Apply this section to your existing profiles.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyToAll('Default API keys')}
                  className="h-8 shrink-0 gap-2 rounded-lg px-2.5 text-xs font-medium"
                >
                  <RefreshCw className="size-4" /> Apply to all profiles
                </Button>
              </div>
            </section>

            {/* 2. Posters */}
            <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-6 shadow-xs">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Posters</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Optional poster providers and their default order for new profiles.
                </p>
              </div>

              {/* Draggable Provider Rows */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={posterProviders.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-1.5">
                    {posterProviders.map((provider) => (
                      <SortablePosterItem
                        key={provider.id}
                        provider={provider}
                        showKey={Boolean(providerKeyVisibility[provider.id])}
                        toggleShowKey={() =>
                          setProviderKeyVisibility((prev) => ({
                            ...prev,
                            [provider.id]: !prev[provider.id],
                          }))
                        }
                        onKeyChange={(val) => updatePosterProviderKey(provider.id, val)}
                        onVerify={() => handleVerify(provider.name)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Posters Checkboxes */}
              <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
                <Checkbox
                  id="default-rpdb-rated"
                  checked={showRatingsOnPosters}
                  onCheckedChange={(c) => setShowRatingsOnPosters(Boolean(c))}
                />
                <Label htmlFor="default-rpdb-rated" className="cursor-pointer text-sm leading-tight">
                  <span className="font-medium text-foreground">Show ratings on posters</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Use the rated poster variant. Which ratings appear (IMDb, MyAnimeList, AniList…) and how they look follow your RPDB / Top Posters account settings.
                  </span>
                </Label>
              </div>

              <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
                <Checkbox
                  id="default-episode-thumbnails"
                  checked={badgedEpisodeStills}
                  onCheckedChange={(c) => setBadgedEpisodeStills(Boolean(c))}
                />
                <Label htmlFor="default-episode-thumbnails" className="cursor-pointer text-sm leading-tight">
                  <span className="font-medium text-foreground">Rating-badged episode stills</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    When your poster provider can render episode stills (Top Posters, EasyRatings, XRDB), use its badged version on the season list. Turn this off to keep the plain TMDB / TheTVDB still and use the provider for posters only, which is the fix if your episode images stop loading after a provider plan change.
                  </span>
                </Label>
              </div>

              <div className="flex items-center justify-between gap-3 border-t pt-4">
                <p className="min-w-0 text-xs text-muted-foreground">
                  Apply this section to your existing profiles.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyToAll('Posters')}
                  className="h-8 shrink-0 gap-2 rounded-lg px-2.5 text-xs font-medium"
                >
                  <RefreshCw className="size-4" /> Apply to all profiles
                </Button>
              </div>
            </section>

            {/* 3. Profile defaults */}
            <section className="flex flex-col gap-5 rounded-xl border bg-card p-4 sm:p-6 shadow-xs">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Profile defaults</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Applied to new profiles. You can still change them per profile.
                </p>
              </div>

              {/* Language */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Language</Label>
                <select
                  value={profileDefaults.language}
                  onChange={(e) => setProfileDefault('language', e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                >
                  <option value="English" className="bg-popover text-popover-foreground">English</option>
                  <option value="Spanish" className="bg-popover text-popover-foreground">Spanish</option>
                  <option value="French" className="bg-popover text-popover-foreground">French</option>
                  <option value="German" className="bg-popover text-popover-foreground">German</option>
                  <option value="Italian" className="bg-popover text-popover-foreground">Italian</option>
                  <option value="Portuguese" className="bg-popover text-popover-foreground">Portuguese</option>
                  <option value="Japanese" className="bg-popover text-popover-foreground">Japanese</option>
                  <option value="Korean" className="bg-popover text-popover-foreground">Korean</option>
                </select>
              </div>

              {/* Fallback Language */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Fallback language</Label>
                  <button
                    type="button"
                    onClick={() => openInfo('fallback-language')}
                    className="relative flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Info className="size-3.5" />
                  </button>
                </div>
                <select
                  value={profileDefaults.fallbackLanguage}
                  onChange={(e) => setProfileDefault('fallbackLanguage', e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                >
                  <option value="English" className="bg-popover text-popover-foreground">English</option>
                  <option value="Spanish" className="bg-popover text-popover-foreground">Spanish</option>
                  <option value="French" className="bg-popover text-popover-foreground">French</option>
                </select>
              </div>

              {/* Timezone */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Timezone</Label>
                  <button
                    type="button"
                    onClick={() => openInfo('timezone')}
                    className="relative flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Info className="size-3.5" />
                  </button>
                </div>
                <select
                  value={profileDefaults.timezone}
                  onChange={(e) => setProfileDefault('timezone', e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                >
                  <option value="Automatic (source air date)" className="bg-popover text-popover-foreground">
                    Automatic (source air date)
                  </option>
                  <option value="UTC" className="bg-popover text-popover-foreground">UTC</option>
                  <option value="America/New_York" className="bg-popover text-popover-foreground">America/New_York (EST)</option>
                  <option value="America/Los_Angeles" className="bg-popover text-popover-foreground">America/Los_Angeles (PST)</option>
                  <option value="Europe/London" className="bg-popover text-popover-foreground">Europe/London (GMT)</option>
                  <option value="Asia/Tokyo" className="bg-popover text-popover-foreground">Asia/Tokyo (JST)</option>
                </select>
              </div>

              {/* Series season & episode source */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Series season & episode source</Label>
                  <button
                    type="button"
                    onClick={() => openInfo('series-source')}
                    className="relative flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Info className="size-3.5" />
                  </button>
                </div>
                <select
                  value={profileDefaults.seriesSource}
                  onChange={(e) => setProfileDefault('seriesSource', e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                >
                  <option value="TheTVDB (matches stream numbering)" className="bg-popover text-popover-foreground">
                    TheTVDB (matches stream numbering)
                  </option>
                  <option value="TMDB (The Movie Database)" className="bg-popover text-popover-foreground">
                    TMDB (The Movie Database)
                  </option>
                </select>
              </div>

              {/* Anime season & episode source */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Anime season & episode source</Label>
                  <button
                    type="button"
                    onClick={() => openInfo('anime-source')}
                    className="relative flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Info className="size-3.5" />
                  </button>
                </div>
                <select
                  value={profileDefaults.animeSource}
                  onChange={(e) => setProfileDefault('animeSource', e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                >
                  <option value="TheTVDB" className="bg-popover text-popover-foreground">TheTVDB</option>
                  <option value="TMDB" className="bg-popover text-popover-foreground">TMDB</option>
                </select>
              </div>

              {/* Anime episode numbering */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Anime episode numbering</Label>
                  <button
                    type="button"
                    onClick={() => openInfo('anime-numbering')}
                    className="relative flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Info className="size-3.5" />
                  </button>
                </div>
                <select
                  value={profileDefaults.animeNumbering}
                  onChange={(e) => setProfileDefault('animeNumbering', e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                >
                  <option value="Absolute (1137)" className="bg-popover text-popover-foreground">Absolute (1137)</option>
                  <option value="Standard (S01E01)" className="bg-popover text-popover-foreground">Standard (S01E01)</option>
                </select>
              </div>

              {/* Filler episodes */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Filler episodes</Label>
                  <button
                    type="button"
                    onClick={() => openInfo('filler-episodes')}
                    className="relative flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Info className="size-3.5" />
                  </button>
                </div>
                <select
                  value={profileDefaults.fillerEpisodes}
                  onChange={(e) => setProfileDefault('fillerEpisodes', e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                >
                  <option value="Tag ([Filler])" className="bg-popover text-popover-foreground">Tag ([Filler])</option>
                  <option value="Hide" className="bg-popover text-popover-foreground">Hide</option>
                  <option value="Include normally" className="bg-popover text-popover-foreground">Include normally</option>
                </select>
              </div>

              {/* Anime stream ID */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Anime stream ID</Label>
                  <button
                    type="button"
                    onClick={() => openInfo('anime-stream-id')}
                    className="relative flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Info className="size-3.5" />
                  </button>
                </div>
                <select
                  value={profileDefaults.animeStreamId}
                  onChange={(e) => setProfileDefault('animeStreamId', e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                >
                  <option value="IMDb (tt2098220:2:49)" className="bg-popover text-popover-foreground">
                    IMDb (tt2098220:2:49)
                  </option>
                  <option value="Kitsu" className="bg-popover text-popover-foreground">Kitsu</option>
                  <option value="AniList" className="bg-popover text-popover-foreground">AniList</option>
                </select>
              </div>

              {/* Anime titles */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Anime titles</Label>
                  <button
                    type="button"
                    onClick={() => openInfo('anime-titles')}
                    className="relative flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Info className="size-3.5" />
                  </button>
                </div>
                <select
                  value={profileDefaults.animeTitles}
                  onChange={(e) => setProfileDefault('animeTitles', e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                >
                  <option value="Default (My Hero Academia)" className="bg-popover text-popover-foreground">
                    Default (My Hero Academia)
                  </option>
                  <option value="Romaji (Boku no Hero Academia)" className="bg-popover text-popover-foreground">
                    Romaji (Boku no Hero Academia)
                  </option>
                  <option value="Japanese" className="bg-popover text-popover-foreground">Japanese</option>
                </select>
              </div>

              {/* Max rating */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Max rating</Label>
                <select
                  value={profileDefaults.maxRating}
                  onChange={(e) => setProfileDefault('maxRating', e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                >
                  <option value="any" className="bg-popover text-popover-foreground">any</option>
                  <option value="G" className="bg-popover text-popover-foreground">G</option>
                  <option value="PG" className="bg-popover text-popover-foreground">PG</option>
                  <option value="PG-13" className="bg-popover text-popover-foreground">PG-13</option>
                  <option value="R" className="bg-popover text-popover-foreground">R</option>
                  <option value="NC-17" className="bg-popover text-popover-foreground">NC-17</option>
                </select>
              </div>

              {/* Quality floor */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Quality floor</Label>
                  <button
                    type="button"
                    onClick={() => openInfo('quality-floor')}
                    className="relative flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Info className="size-3.5" />
                  </button>
                </div>
                <select
                  value={profileDefaults.qualityFloor}
                  onChange={(e) => setProfileDefault('qualityFloor', e.target.value)}
                  className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                >
                  <option value="Good (6.5+ rating, 100+ votes)" className="bg-popover text-popover-foreground">
                    Good (6.5+ rating, 100+ votes)
                  </option>
                  <option value="High (7.5+ rating, 500+ votes)" className="bg-popover text-popover-foreground">
                    High (7.5+ rating, 500+ votes)
                  </option>
                  <option value="None (any rating)" className="bg-popover text-popover-foreground">
                    None (any rating)
                  </option>
                </select>
              </div>

              {/* Origin countries */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Origin countries</Label>
                  <button
                    type="button"
                    onClick={() => openInfo('origin-countries')}
                    className="relative flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Info className="size-3.5" />
                  </button>
                </div>
                <div className="flex min-h-10 w-full cursor-pointer items-start justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-3 text-sm select-none">
                  <span className="text-muted-foreground">All countries</span>
                  <ChevronDown className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                </div>
              </div>

              {/* Exclude countries */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">Exclude countries</Label>
                  <button
                    type="button"
                    onClick={() => openInfo('exclude-countries')}
                    className="relative flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Info className="size-3.5" />
                  </button>
                </div>
                <div className="flex min-h-10 w-full cursor-pointer items-start justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-3 text-sm select-none">
                  <span className="text-muted-foreground">All countries</span>
                  <ChevronDown className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                </div>
              </div>

              {/* Filter Checkboxes */}
              <div className="flex items-start gap-3">
                <Checkbox
                  id="default-exclude-watched"
                  checked={profileDefaults.hideWatched}
                  onCheckedChange={(c) => setProfileDefault('hideWatched', Boolean(c))}
                />
                <Label htmlFor="default-exclude-watched" className="cursor-pointer text-sm leading-tight">
                  <span className="font-medium text-foreground">Hide content I've already watched</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Hide titles you've already watched (from your connected trackers or linked Nuvio account) from every catalog row. Your own lists (watchlists, favorites, your Trakt/TMDB lists) and search are not affected.
                  </span>
                </Label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="default-exclude-caught-up"
                  checked={profileDefaults.hideCaughtUp}
                  onCheckedChange={(c) => setProfileDefault('hideCaughtUp', Boolean(c))}
                />
                <Label htmlFor="default-exclude-caught-up" className="cursor-pointer text-sm leading-tight">
                  <span className="font-medium text-foreground">Hide TV shows I'm caught up on</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Hide series where you've watched every episode that has aired so far, until a new one is released. Separate from the setting above, which can only hide shows your tracker records as fully finished.
                  </span>
                </Label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="default-exclude-unreleased"
                  checked={profileDefaults.excludeUnreleased}
                  onCheckedChange={(c) => setProfileDefault('excludeUnreleased', Boolean(c))}
                />
                <Label htmlFor="default-exclude-unreleased" className="cursor-pointer text-sm leading-tight">
                  <span className="font-medium text-foreground">Exclude unreleased titles</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Hide content with no release date or in the future. Search is not affected.
                  </span>
                </Label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="default-exclude-pre-digital"
                  checked={profileDefaults.preDigitalOnly}
                  onCheckedChange={(c) => setProfileDefault('preDigitalOnly', Boolean(c))}
                />
                <Label htmlFor="default-exclude-pre-digital" className="cursor-pointer text-sm leading-tight">
                  <span className="font-medium text-foreground">Movies: digital release only</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Hide movies until a digital, physical, or TV release date has passed on TMDB, a good sign a decent-quality version exists. Series and search are not affected.
                  </span>
                </Label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="default-hide-adult"
                  checked={profileDefaults.hideAdult}
                  onCheckedChange={(c) => setProfileDefault('hideAdult', Boolean(c))}
                />
                <Label htmlFor="default-hide-adult" className="cursor-pointer text-sm leading-tight">
                  <span className="font-medium text-foreground">Hide adult content</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Hide pornographic and hentai titles from every catalog and search. R-rated movies are not affected.
                  </span>
                </Label>
              </div>

              {/* AI Section */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">AI provider</Label>
                  <select
                    value={profileDefaults.aiProvider}
                    onChange={(e) => setProfileDefault('aiProvider', e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                  >
                    <option value="Google Gemini" className="bg-popover text-popover-foreground">Google Gemini</option>
                    <option value="Groq" className="bg-popover text-popover-foreground">Groq</option>
                    <option value="DeepSeek" className="bg-popover text-popover-foreground">DeepSeek</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">AI model</Label>
                  <select
                    value={profileDefaults.aiModel}
                    onChange={(e) => setProfileDefault('aiModel', e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                  >
                    <option value="gemini-3.5-flash-lite" className="bg-popover text-popover-foreground">gemini-3.5-flash-lite</option>
                    <option value="gemini-2.5-flash" className="bg-popover text-popover-foreground">gemini-2.5-flash</option>
                    <option value="gemini-2.5-pro" className="bg-popover text-popover-foreground">gemini-2.5-pro</option>
                  </select>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Gemma models share your Google key but have a separate, larger free quota. If the selected Google model hits its rate limit, the remaining models are tried automatically.
              </p>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="default-ai"
                  checked={profileDefaults.enableAi}
                  onCheckedChange={(c) => setProfileDefault('enableAi', Boolean(c))}
                />
                <Label htmlFor="default-ai" className="cursor-pointer text-sm leading-tight">
                  <span className="font-medium text-foreground">Enable AI recommendations</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Turn on AI-powered recommendations for new profiles (requires an AI provider key).
                  </span>
                </Label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="default-ai-search"
                  checked={profileDefaults.enableAiSearch}
                  onCheckedChange={(c) => setProfileDefault('enableAiSearch', Boolean(c))}
                />
                <Label htmlFor="default-ai-search" className="cursor-pointer text-sm leading-tight">
                  <span className="font-medium text-foreground">Enable AI-powered search</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Search by description or vibe, not just exact titles. No API key needed. Your own AI provider key adds more results.
                  </span>
                </Label>
              </div>

              <div className="flex items-center justify-between gap-3 border-t pt-4">
                <p className="min-w-0 text-xs text-muted-foreground">
                  Apply this section to your existing profiles.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyToAll('Profile defaults')}
                  className="h-8 shrink-0 gap-2 rounded-lg px-2.5 text-xs font-medium"
                >
                  <RefreshCw className="size-4" /> Apply to all profiles
                </Button>
              </div>
            </section>

            {/* 4. Appearance & language */}
            <section className="flex flex-col gap-5 rounded-xl border bg-card p-4 sm:p-6 shadow-xs">
              <h2 className="text-sm font-semibold text-foreground">Appearance &amp; language</h2>

              {/* Theme toggle */}
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="theme-switch" className="cursor-pointer text-sm leading-tight">
                  <span className="inline-flex items-center gap-2 font-medium text-foreground">
                    {theme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />} Dark mode
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Switch between the dark and light theme.
                  </span>
                </Label>
                <Switch
                  id="theme-switch"
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                  aria-label="Dark mode"
                />
              </div>

              {/* App Language */}
              <div className="flex items-center justify-between gap-4 border-t pt-5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">App language</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    The language of the interface.
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="outline" size="sm" className="h-8 gap-1 rounded-lg px-3 text-xs font-medium">
                        <Globe className="size-3.5 mr-1 text-muted-foreground" />
                        {appLanguage}
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-36">
                    {['English', 'Spanish', 'French', 'German', 'Japanese'].map((lang) => (
                      <DropdownMenuItem
                        key={lang}
                        onClick={() => {
                          setAppLanguage(lang)
                          toast.success(`Language set to ${lang}`)
                        }}
                      >
                        {lang}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </section>

            {/* 5. Nuvio account */}
            <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-6 shadow-xs">
              <div className="flex items-center gap-3">
                <NuvioLogo />
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">Nuvio account</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Link your Nuvio account to assign avatars and push collections to your profiles.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t pt-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <CircleCheck className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {connections.nuvio.email}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {connections.nuvio.profilesCount} profiles
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConnection('nuvio', { connected: false })
                    toast.info('Nuvio account unlinked')
                  }}
                  className="h-8 shrink-0 gap-2 rounded-lg px-2.5 text-xs font-medium"
                >
                  <Link2Off className="size-4" /> Unlink
                </Button>
              </div>
            </section>

            {/* 6. TMDB account */}
            <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-6 shadow-xs">
              <div className="flex items-center gap-3">
                <TmdbLogo />
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">TMDB account</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Connect once to add your TMDB Watchlist, Favorites, Rated, and lists as home rows. New profiles inherit this connection.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t pt-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full ${connections.tmdb.connected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {connections.tmdb.connected ? <CircleCheck className="size-5" /> : <Link2 className="size-5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {connections.tmdb.connected ? connections.tmdb.username || 'Connected' : 'Not connected'}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {connections.tmdb.connected ? 'Connected to TMDB API' : 'Connect your TMDB account.'}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={connections.tmdb.connected ? 'outline' : 'default'}
                  onClick={() => {
                    const next = !connections.tmdb.connected
                    setConnection('tmdb', { connected: next, username: next ? 'TMDBUser' : '' })
                    toast.success(next ? 'Connected TMDB account' : 'Disconnected TMDB')
                  }}
                  className="h-8 shrink-0 gap-2 rounded-lg px-2.5 text-xs font-medium"
                >
                  {connections.tmdb.connected ? <Link2Off className="size-4" /> : <Link2 className="size-4" />}
                  {connections.tmdb.connected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            </section>

            {/* 7. Trakt account */}
            <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-6 shadow-xs">
              <div className="flex items-center gap-3">
                <TraktLogo />
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">Trakt account</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Link your Trakt once and new profiles will use it automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t pt-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <CircleCheck className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {connections.trakt.username}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      New profiles will use this Trakt account by default.
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setConnection('trakt', { connected: false })
                      toast.info('Trakt account disconnected')
                    }}
                    className="h-8 shrink-0 gap-2 rounded-lg px-2.5 text-xs font-medium"
                  >
                    <Link2Off className="size-4" /> Disconnect
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t pt-4">
                <p className="min-w-0 text-xs text-muted-foreground">
                  Use this Trakt account on your existing profiles too.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyToAll('Trakt account')}
                  className="h-8 shrink-0 gap-2 rounded-lg px-2.5 text-xs font-medium"
                >
                  <RefreshCw className="size-4" /> Apply to existing profiles
                </Button>
              </div>

              <div className="flex flex-col gap-3 border-t pt-4">
                <div className="flex items-start gap-3">
                  <Switch
                    checked={connections.trakt.scrobble}
                    onCheckedChange={(c) => setConnection('trakt', { scrobble: Boolean(c) })}
                    aria-label="Scrobble now watching to Trakt"
                  />
                  <div className="min-w-0 text-sm leading-tight">
                    <span className="font-medium text-foreground">Scrobble now watching to Trakt</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      When you press play in Stremio or Nuvio, mark the title as watching (and watched when it finishes) on Trakt.
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="min-w-0 text-xs text-muted-foreground">
                    Apply this scrobble default to all your existing profiles.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyToAll('Trakt scrobble')}
                    className="h-8 shrink-0 gap-2 rounded-lg px-2.5 text-xs font-medium"
                  >
                    <RefreshCw className="size-4" /> Apply to profiles
                  </Button>
                </div>
              </div>
            </section>

            {/* 8. Simkl account */}
            <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-6 shadow-xs">
              <div className="flex items-center gap-3">
                <SimklLogo />
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">Simkl account</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Link your Simkl once and new profiles will use it automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t pt-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full ${connections.simkl.connected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {connections.simkl.connected ? <CircleCheck className="size-5" /> : <Link2 className="size-5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {connections.simkl.connected ? connections.simkl.username : 'Not connected'}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      Connect Simkl to bring your Plan to Watch list and watch history into new profiles.
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={connections.simkl.connected ? 'outline' : 'default'}
                  onClick={() => {
                    const next = !connections.simkl.connected
                    setConnection('simkl', { connected: next, username: next ? 'SimklUser' : '' })
                    toast.success(next ? 'Connected Simkl' : 'Disconnected Simkl')
                  }}
                  className="h-8 shrink-0 gap-2 rounded-lg px-2.5 text-xs font-medium"
                >
                  {connections.simkl.connected ? <Link2Off className="size-4" /> : <Link2 className="size-4" />}
                  {connections.simkl.connected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            </section>

            {/* 9. AniList account */}
            <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-6 shadow-xs">
              <div className="flex items-center gap-3">
                <AniListLogo />
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">AniList account</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Link your AniList once and new profiles will use it automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t pt-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full ${connections.anilist.connected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {connections.anilist.connected ? <CircleCheck className="size-5" /> : <Link2 className="size-5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {connections.anilist.connected ? connections.anilist.username : 'Not connected'}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      Connect to bring your lists and history into new profiles.
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={connections.anilist.connected ? 'outline' : 'default'}
                  onClick={() => {
                    const next = !connections.anilist.connected
                    setConnection('anilist', { connected: next, username: next ? 'AniListUser' : '' })
                    toast.success(next ? 'Connected AniList' : 'Disconnected AniList')
                  }}
                  className="h-8 shrink-0 gap-2 rounded-lg px-2.5 text-xs font-medium"
                >
                  {connections.anilist.connected ? <Link2Off className="size-4" /> : <Link2 className="size-4" />}
                  {connections.anilist.connected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            </section>

            {/* 10. MyAnimeList account */}
            <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-6 shadow-xs">
              <div className="flex items-center gap-3">
                <MalLogo />
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">MyAnimeList account</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Link your MyAnimeList once and new profiles will use it automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 border-t pt-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full ${connections.myanimelist.connected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {connections.myanimelist.connected ? <CircleCheck className="size-5" /> : <Link2 className="size-5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {connections.myanimelist.connected ? connections.myanimelist.username : 'Not connected'}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      Connect to bring your lists and history into new profiles.
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={connections.myanimelist.connected ? 'outline' : 'default'}
                  onClick={() => {
                    const next = !connections.myanimelist.connected
                    setConnection('myanimelist', { connected: next, username: next ? 'MALUser' : '' })
                    toast.success(next ? 'Connected MyAnimeList' : 'Disconnected MyAnimeList')
                  }}
                  className="h-8 shrink-0 gap-2 rounded-lg px-2.5 text-xs font-medium"
                >
                  {connections.myanimelist.connected ? <Link2Off className="size-4" /> : <Link2 className="size-4" />}
                  {connections.myanimelist.connected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            </section>

            {/* 11. When playback ends */}
            <section className="flex flex-col gap-5 rounded-xl border bg-card p-4 sm:p-6 shadow-xs">
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-foreground">When playback ends</p>
                <RadioGroup
                  value={playbackCompletion}
                  onValueChange={(val: 'auto' | 'strict') => setPlaybackCompletion(val)}
                  className="grid w-full gap-3"
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="auto" id="playback-auto" className="mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="playback-auto" className="cursor-pointer text-sm font-medium text-foreground">
                        Mark as watched
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        After the title's runtime, mark it watched on every connected tracker. Stremio does not report progress, so a title you stop early is still marked watched.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <RadioGroupItem value="strict" id="playback-strict" className="mt-0.5" />
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="playback-strict" className="cursor-pointer text-sm font-medium text-foreground">
                        Only when finished
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Mark it watched only when we can tell it played through: your linked Nuvio account reports that you reached the end, or you start the next episode. Otherwise it goes to your tracker's Continue Watching list instead of your history, at the point where you actually stopped. AniList and MyAnimeList have no Continue Watching list, so the title stays under Watching there and the episode is not counted.
                      </p>
                    </div>
                  </div>
                </RadioGroup>

                <div className="flex items-center justify-between gap-4 border-t pt-4">
                  <p className="min-w-0 text-xs text-muted-foreground">
                    Apply this completion setting to your existing profiles.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyToAll('Playback completion setting')}
                    className="h-8 shrink-0 gap-2 rounded-lg px-2.5 text-xs font-medium"
                  >
                    <RefreshCw className="size-4" /> Apply to profiles
                  </Button>
                </div>
              </div>
            </section>

            {/* 12. Account */}
            <section className="flex flex-col gap-5 rounded-xl border bg-card p-4 sm:p-6 shadow-xs">
              <h2 className="text-sm font-semibold text-foreground">Account</h2>
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="relative grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-primary text-xs font-semibold">
                    N
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Signed in as</p>
                    <p className="truncate text-sm font-medium text-foreground">
                      neerajlovecyber@gmail.com
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success('Signed out successfully')}
                  className="h-8 gap-2 rounded-lg px-2.5 text-xs font-medium"
                >
                  <LogOut className="size-4" /> Sign out
                </Button>
              </div>

              <div className="flex items-center justify-between gap-4 border-t pt-5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-destructive">Delete account</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Permanently delete your account, profiles, and saved settings. This cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="h-8 gap-2 rounded-lg px-2.5 text-xs font-medium shrink-0"
                >
                  <Trash2 className="size-4" /> Delete account
                </Button>
              </div>
            </section>
          </div>
        </div>

        {/* Informative Sheet Modal */}
        <Sheet open={Boolean(infoSheetKey)} onOpenChange={(open) => !open && setInfoSheetKey(null)}>
          <SheetContent side="right" className="sm:max-w-md p-6">
            {activeInfo && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-base font-semibold">{activeInfo.title}</SheetTitle>
                  <SheetDescription className="text-sm mt-2 text-muted-foreground">
                    {activeInfo.description}
                  </SheetDescription>
                </SheetHeader>
                {activeInfo.detail && (
                  <div className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                    {activeInfo.detail}
                  </div>
                )}
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Confirm Delete Account Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account, saved profiles, and all associated settings.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  toast.success('Account deleted')
                  setDeleteDialogOpen(false)
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
