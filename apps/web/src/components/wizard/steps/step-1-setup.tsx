import * as React from 'react'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Compass,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Image as ImageIcon,
  Info,
  KeyRound,
  Link2,
  Link2Off,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tv,
} from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Checkbox } from '@workspace/ui/components/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { Switch } from '@workspace/ui/components/switch'
import { PostersConfigSection } from '@/components/posters-config-section'
import { AGE_RATINGS } from '@/data/age-ratings'
import languagesData from '@/data/languages.json'
import { STREAMING_REGIONS } from '@/data/streamings'
import {
  GENRES_LIST,
  GEMINI_MODELS,
  GROQ_MODELS,
  POPULAR_LANGUAGES,
} from '../wizard-constants'
import { useWizard } from '../wizard-context'

export function Step1Setup() {
  const {
    profileName,
    setProfileName,
    openSection,
    setOpenSection,
    mdbListKey,
    setMdbListKey,
    scrobbleMdbList,
    setScrobbleMdbList,
    isMdbListValid,
    step1Submitted,
    isStep1Valid,
    tmdbToken,
    setTmdbToken,
    isTmdbValid,
    proxyUrl,
    setProxyUrl,
    letterboxd,
    setLetterboxd,
    showLetterboxd,
    setShowLetterboxd,
    letterboxdVerified,
    handleVerifyLetterboxd,
    traktConnected,
    traktUsername,
    scrobbleTrakt,
    setScrobbleTrakt,
    simklConnected,
    simklUsername,
    anilistConnected,
    anilistUsername,
    malConnected,
    malUsername,
    tmdbAccountConnected,
    tmdbAccountUsername,
    playbackEndRule,
    setPlaybackEndRule,
    openConnectDialog,
    handleDisconnect,
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
    language,
    setLanguage,
    ageRating,
    setAgeRating,
    selectedRegion,
    setSelectedRegion,
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
    excludedGenres,
    setExcludedGenres,
    animeSource,
    setAnimeSource,
    animeNumbering,
    setAnimeNumbering,
    fillerEpisodes,
    setFillerEpisodes,
    animeStreamId,
    setAnimeStreamId,
  } = useWizard()

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col animate-in fade-in-50 duration-200">
      <header className="shrink-0 border-b pb-4">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
          Setup
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Name your profile and connect the catalog providers.
        </p>
      </header>

      <div className="flex flex-col gap-4 pt-4 pb-6 sm:gap-6 sm:pt-6 lg:pb-10">
        {/* 1. Profile Name */}
        <section className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:p-6">
          <div className="flex flex-col gap-2">
            <div className="flex min-h-5 items-center gap-1">
              <Label
                htmlFor="pname"
                className="flex items-center gap-2 text-sm font-medium text-foreground select-none"
              >
                Profile name
              </Label>
              <button
                type="button"
                className="relative flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground cursor-pointer"
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
            onClick={() =>
              setOpenSection(openSection === 'integrations' ? null : 'integrations')
            }
            className="flex w-full items-center gap-3 rounded-xl p-4 text-left transition-colors hover:bg-accent/50 sm:px-6 cursor-pointer"
            aria-expanded={openSection === 'integrations'}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted/60">
              <KeyRound className="size-4 text-muted-foreground" />
            </span>
            <span className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="block text-sm font-semibold text-foreground">Integrations</span>
                {!isStep1Valid && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-destructive bg-destructive/10 border border-destructive/20 rounded px-1.5 py-0.5">
                    Keys Required
                  </span>
                )}
              </div>
              <span className="mt-0.5 flex items-center gap-1.5 truncate text-xs">
                {isStep1Valid ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="size-3 shrink-0" /> Both required keys verified. You
                    can continue.
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                    <AlertCircle className="size-3 shrink-0" /> TMDB Read Access Token &amp; MDBList
                    Key are required.
                  </span>
                )}
              </span>
            </span>
            <ChevronRight
              className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                openSection === 'integrations' ? 'rotate-90' : ''
              }`}
            />
          </button>

          {openSection === 'integrations' && (
            <div className="px-4 pb-6 pt-2 sm:px-6 border-t border-border/60 space-y-6 text-sm">
              {/* 1. MDBList */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground text-xs">
                      MDBList Key <span className="text-destructive font-bold">*</span>
                    </span>
                    <span className="text-[10px] font-semibold text-destructive uppercase tracking-wider bg-destructive/10 border border-destructive/20 rounded px-1.5 py-0.2">
                      Required
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isMdbListValid && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/30">
                        <CheckCircle2 className="size-3" /> Verified
                      </span>
                    )}
                    <a
                      href="https://mdblist.com/preferences/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Get a key <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
                <Input
                  value={mdbListKey}
                  onChange={(e) => setMdbListKey(e.target.value)}
                  placeholder="Enter your MDBList API key"
                  className={`font-mono text-xs ${
                    step1Submitted && !isMdbListValid
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }`}
                />
                {step1Submitted && !isMdbListValid && (
                  <p className="text-xs text-destructive flex items-center gap-1 font-medium">
                    <AlertCircle className="size-3 shrink-0" /> MDBList Key is required to generate
                    catalogs and watchlists.
                  </p>
                )}
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer pt-1">
                  <Checkbox
                    checked={scrobbleMdbList}
                    onCheckedChange={(c) => setScrobbleMdbList(!!c)}
                  />
                  <span>Scrobble now watching to MDBList</span>
                </label>
              </div>

              {/* 2. TMDB */}
              <div className="space-y-2 border-t border-border/40 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground text-xs">
                      TMDB Read Access Token <span className="text-destructive font-bold">*</span>
                    </span>
                    <span className="text-[10px] font-semibold text-destructive uppercase tracking-wider bg-destructive/10 border border-destructive/20 rounded px-1.5 py-0.2">
                      Required
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isTmdbValid && tmdbToken.startsWith('eyJ') ? (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/30">
                        <CheckCircle2 className="size-3" /> Verified
                      </span>
                    ) : isTmdbValid ? (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium border border-amber-500/30">
                        Token entered
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium border border-destructive/20">
                        Required
                      </span>
                    )}
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
                  placeholder="eyJhbGciOiJIUzI1NiJ9..."
                  className={`font-mono text-xs ${
                    step1Submitted && !isTmdbValid
                      ? 'border-destructive focus-visible:ring-destructive'
                      : ''
                  }`}
                />
                {step1Submitted && !isTmdbValid && (
                  <p className="text-xs text-destructive flex items-center gap-1 font-medium">
                    <AlertCircle className="size-3 shrink-0" /> TMDB API Read Access Token is
                    required to fetch movie and TV metadata.
                  </p>
                )}
                {isTmdbValid && !tmdbToken.startsWith('eyJ') && (
                  <p className="text-xs text-amber-500 flex items-center gap-1 font-medium">
                    <AlertCircle className="size-3 shrink-0" /> Note: TMDB API Read Access Token
                    should start with "eyJ...". Make sure to copy the long token, not the short API
                    key.
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  On TMDB (Settings → API), copy the long API Read Access Token starting with "eyJ",
                  not the short API key.
                </p>

                {/* TMDB Reverse Proxy / Mirror URL */}
                <div className="space-y-1.5 pt-3 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground text-xs">
                      TMDB Reverse Proxy / Mirror (Optional)
                    </span>
                    <span className="text-[10px] text-muted-foreground">ISP bypass</span>
                  </div>
                  <Input
                    value={proxyUrl}
                    onChange={(e) => setProxyUrl(e.target.value)}
                    placeholder="https://tmdb-proxy.example.com/3 (optional)"
                    className="font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Optional proxy URL to bypass regional blocks (e.g., in India or restricted
                    networks).
                  </p>
                </div>
              </div>

              {/* 3. Letterboxd */}
              <div className="space-y-2 border-t border-border/40 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground text-xs">Letterboxd</span>
                    <button
                      type="button"
                      onClick={() => setActiveInfoKey('letterboxd')}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Letterboxd info"
                    >
                      <Info className="size-3.5" />
                    </button>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Public lists & watchlist</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showLetterboxd ? 'text' : 'password'}
                      value={letterboxd}
                      onChange={(e) => setLetterboxd(e.target.value)}
                      placeholder="Letterboxd username"
                      className="font-mono text-xs pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLetterboxd((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                    >
                      {showLetterboxd ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleVerifyLetterboxd}
                    className="h-9 px-3 text-xs font-medium cursor-pointer"
                  >
                    {letterboxdVerified ? 'Verified' : 'Verify'}
                  </Button>
                </div>
              </div>

              {/* 4. Trakt */}
              <div className="space-y-3 border-t border-border/40 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground text-xs">Trakt account</span>
                    <button
                      type="button"
                      onClick={() => setActiveInfoKey('trakt')}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Trakt info"
                    >
                      <Info className="size-3.5" />
                    </button>
                    {traktConnected && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="size-3 shrink-0" /> Connected as {traktUsername}
                      </span>
                    )}
                  </div>
                  <div>
                    {traktConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect('trakt')}
                        className="h-9 gap-2 text-xs font-medium cursor-pointer"
                      >
                        <Link2Off className="size-3.5" /> Disconnect Trakt
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openConnectDialog('trakt')}
                        className="h-9 gap-2 text-xs font-medium cursor-pointer"
                      >
                        <Link2 className="size-3.5" /> Connect Trakt
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">
                      Scrobble now watching to Trakt
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveInfoKey('trakt-scrobble')}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Scrobble info"
                    >
                      <Info className="size-3" />
                    </button>
                  </div>
                  <Switch checked={scrobbleTrakt} onCheckedChange={setScrobbleTrakt} />
                </div>
              </div>

              {/* 5. Simkl */}
              <div className="flex items-center justify-between border-t border-border/40 pt-4">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground text-xs">Simkl account</span>
                  <button
                    type="button"
                    onClick={() => setActiveInfoKey('simkl')}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Simkl info"
                  >
                    <Info className="size-3.5" />
                  </button>
                  {simklConnected && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="size-3 shrink-0" /> Connected as {simklUsername}
                    </span>
                  )}
                </div>
                <div>
                  {simklConnected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect('simkl')}
                      className="h-9 gap-2 text-xs font-medium cursor-pointer"
                    >
                      <Link2Off className="size-3.5" /> Disconnect Simkl
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openConnectDialog('simkl')}
                      className="h-9 gap-2 text-xs font-medium cursor-pointer"
                    >
                      <Link2 className="size-3.5" /> Connect Simkl
                    </Button>
                  )}
                </div>
              </div>

              {/* 6. AniList */}
              <div className="flex items-center justify-between border-t border-border/40 pt-4">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground text-xs">AniList account</span>
                  <button
                    type="button"
                    onClick={() => setActiveInfoKey('anilist')}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                    title="AniList info"
                  >
                    <Info className="size-3.5" />
                  </button>
                  {anilistConnected && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="size-3 shrink-0" /> Connected as {anilistUsername}
                    </span>
                  )}
                </div>
                <div>
                  {anilistConnected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect('anilist')}
                      className="h-9 gap-2 text-xs font-medium cursor-pointer"
                    >
                      <Link2Off className="size-3.5" /> Disconnect AniList
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openConnectDialog('anilist')}
                      className="h-9 gap-2 text-xs font-medium cursor-pointer"
                    >
                      <Link2 className="size-3.5" /> Connect AniList
                    </Button>
                  )}
                </div>
              </div>

              {/* 7. MyAnimeList */}
              <div className="flex items-center justify-between border-t border-border/40 pt-4">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground text-xs">MyAnimeList account</span>
                  <button
                    type="button"
                    onClick={() => setActiveInfoKey('myanimelist')}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                    title="MyAnimeList info"
                  >
                    <Info className="size-3.5" />
                  </button>
                  {malConnected && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="size-3 shrink-0" /> Connected as {malUsername}
                    </span>
                  )}
                </div>
                <div>
                  {malConnected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect('myanimelist')}
                      className="h-9 gap-2 text-xs font-medium cursor-pointer"
                    >
                      <Link2Off className="size-3.5" /> Disconnect MyAnimeList
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openConnectDialog('myanimelist')}
                      className="h-9 gap-2 text-xs font-medium cursor-pointer"
                    >
                      <Link2 className="size-3.5" /> Connect MyAnimeList
                    </Button>
                  )}
                </div>
              </div>

              {/* 8. When playback ends */}
              <div className="space-y-2 border-t border-border/40 pt-4">
                <span className="font-medium text-foreground text-xs">When playback ends</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPlaybackEndRule('watched')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                      playbackEndRule === 'watched'
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-background hover:bg-accent/40 text-muted-foreground'
                    }`}
                  >
                    <div
                      className={`size-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                        playbackEndRule === 'watched'
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {playbackEndRule === 'watched' && (
                        <div className="size-1.5 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        Mark as watched automatically
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Track progress without manual input
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlaybackEndRule('finished')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                      playbackEndRule === 'finished'
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-background hover:bg-accent/40 text-muted-foreground'
                    }`}
                  >
                    <div
                      className={`size-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                        playbackEndRule === 'finished'
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {playbackEndRule === 'finished' && (
                        <div className="size-1.5 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        Only when finished completely
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Wait until video hits ending
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 9. TMDB account */}
              <div className="flex items-center justify-between border-t border-border/40 pt-4">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground text-xs">TMDB account</span>
                  <button
                    type="button"
                    onClick={() => setActiveInfoKey('tmdb-account')}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                    title="TMDB account info"
                  >
                    <Info className="size-3.5" />
                  </button>
                  {tmdbAccountConnected && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="size-3 shrink-0" /> Connected as {tmdbAccountUsername}
                    </span>
                  )}
                </div>
                <div>
                  {tmdbAccountConnected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect('tmdb')}
                      className="h-9 gap-2 text-xs font-medium cursor-pointer"
                    >
                      <Link2Off className="size-3.5" /> Disconnect TMDB
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openConnectDialog('tmdb')}
                      className="h-9 gap-2 text-xs font-medium cursor-pointer"
                    >
                      <Link2 className="size-3.5" /> Connect TMDB
                    </Button>
                  )}
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
              <span className="block text-sm font-semibold text-foreground">
                AI Recommendations
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {aiProvider}
              </span>
            </span>
            <ChevronRight
              className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                openSection === 'ai' ? 'rotate-90' : ''
              }`}
            />
          </button>

          {openSection === 'ai' && (
            <div className="px-4 pb-6 pt-2 sm:px-6 border-t border-border/60 space-y-4 text-sm">
              <div className="space-y-1.5">
                <Label className="text-xs text-foreground">AI Provider</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAiProvider('Google Gemini')
                      setAiModel('gemini-3.5-flash-lite')
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center justify-between transition-colors cursor-pointer ${
                      aiProvider === 'Google Gemini'
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    <span>Google Gemini</span>
                    {aiProvider === 'Google Gemini' && (
                      <Check className="size-3 text-primary" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAiProvider('Groq')
                      setAiModel('openai/gpt-oss-120b')
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border flex items-center justify-between transition-colors cursor-pointer ${
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

              {/* Model Selector */}
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
                  <DropdownMenuContent
                    align="start"
                    className="w-[calc(100vw-3rem)] max-w-[420px] p-1 bg-popover/95 backdrop-blur-md border-border/80 shadow-xl"
                  >
                    {(aiProvider === 'Groq' ? GROQ_MODELS : GEMINI_MODELS).map((m) => (
                      <DropdownMenuItem
                        key={m.id}
                        onClick={() => setAiModel(m.id)}
                        className="flex items-center justify-between py-2 px-3 text-xs font-mono cursor-pointer rounded-md hover:bg-accent hover:text-accent-foreground"
                      >
                        <span
                          className={
                            aiModel === m.id
                              ? 'text-primary font-medium'
                              : 'text-foreground/80'
                          }
                        >
                          {m.label}
                        </span>
                        {aiModel === m.id && (
                          <Check className="size-3.5 text-primary shrink-0 ml-2" />
                        )}
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
                Your Trakt watch history and MDBList list names are sent to generate personalized
                catalog rows.
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
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {searchEnabled ? 'On' : 'Off'}
              </span>
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
                <Checkbox
                  checked={searchIncludeXp}
                  onCheckedChange={(c) => setSearchIncludeXp(!!c)}
                />
                <span>Include Xperience in Nuvio search</span>
              </label>
              <label className="flex items-center gap-2 text-foreground cursor-pointer">
                <Checkbox
                  checked={searchAnimeRows}
                  onCheckedChange={(c) => setSearchAnimeRows(!!c)}
                />
                <span>Show anime in their own search rows</span>
              </label>
              <label className="flex items-center gap-2 text-foreground cursor-pointer">
                <Checkbox
                  checked={searchAiSuggestions}
                  onCheckedChange={(c) => setSearchAiSuggestions(!!c)}
                />
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
                  <Label className="text-[11px] text-muted-foreground">
                    Main rows label override
                  </Label>
                  <Input
                    placeholder="Default"
                    value={searchMainRowsName}
                    onChange={(e) => setSearchMainRowsName(e.target.value)}
                    className="text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">
                    Anime rows label override
                  </Label>
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
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {discoverEnabled ? 'On' : 'Off'}
              </span>
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
                Show the built-in Movies and Series browse catalogs. Rename them if you want
                something else in Discover.
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
            onClick={() =>
              setOpenSection(openSection === 'preferences' ? null : 'preferences')
            }
            className="flex w-full items-center gap-3 rounded-xl p-4 text-left transition-colors hover:bg-accent/50 sm:px-6 cursor-pointer"
            aria-expanded={openSection === 'preferences'}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted/60">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">Preferences</span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {POPULAR_LANGUAGES.find((l) => l.code === language)?.name || language} ·{' '}
                {selectedRegion} · {ageRating === 'NONE' ? 'All Ratings' : ageRating}
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
                  <Label className="text-xs font-semibold text-foreground">
                    Content Age Rating
                  </Label>
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
                        className={`px-2 py-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
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
                  Adapts streaming provider catalogs (Netflix, Disney+, Prime, etc.) to show
                  titles available in this region.
                </p>
              </div>

              {/* Checkbox Preferences */}
              <div className="space-y-2.5 border-t border-border/40 pt-4">
                <label className="flex items-center gap-2 text-foreground cursor-pointer">
                  <Checkbox checked={hideAdult} onCheckedChange={(c) => setHideAdult(!!c)} />
                  <span>Hide adult content (pornographic & hentai titles)</span>
                </label>
                <label className="flex items-center gap-2 text-foreground cursor-pointer">
                  <Checkbox
                    checked={excludeUnreleased}
                    onCheckedChange={(c) => setExcludeUnreleased(!!c)}
                  />
                  <span>Exclude unreleased titles</span>
                </label>
                <label className="flex items-center gap-2 text-foreground cursor-pointer">
                  <Checkbox
                    checked={moviesDigitalOnly}
                    onCheckedChange={(c) => setMoviesDigitalOnly(!!c)}
                  />
                  <span>Movies: digital release only</span>
                </label>
                <label className="flex items-center gap-2 text-foreground cursor-pointer">
                  <Checkbox checked={hideWatched} onCheckedChange={(c) => setHideWatched(!!c)} />
                  <span>Hide content I've already watched</span>
                </label>
                <label className="flex items-center gap-2 text-foreground cursor-pointer">
                  <Checkbox
                    checked={hideCaughtUp}
                    onCheckedChange={(c) => setHideCaughtUp(!!c)}
                  />
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
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
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

        {/* 8. Anime */}
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
                <Label className="text-xs font-semibold text-foreground">
                  Anime season & episode source
                </Label>
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
                <Label className="text-xs font-semibold text-foreground">
                  Anime episode numbering
                </Label>
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
  )
}
