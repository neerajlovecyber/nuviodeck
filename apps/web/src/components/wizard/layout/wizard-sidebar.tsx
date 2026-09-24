import * as React from 'react'
import { Button } from '@workspace/ui/components/button'
import { Check, Play, Sliders, Sparkles } from 'lucide-react'
import { useWizard } from '../wizard-context'

export function WizardSidebar() {
  const {
    step,
    setupPercent,
    setPreviewOpen,
    setArrangeHomeOpen,
    selectedRows,
    collections,
    isMdbListValid,
    isTmdbValid,
    traktConnected,
    simklConnected,
    anilistConnected,
    malConnected,
    tmdbAccountConnected,
    aiApiKey,
    groqApiKey,
    posterProviders,
  } = useWizard()

  if (step === 2) return null

  const aiConfigured = Boolean(aiApiKey.trim() || groqApiKey.trim())

  return (
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
          className="w-full text-xs gap-1.5 cursor-pointer"
        >
          <Play className="size-3 text-primary" />
          Open preview
        </Button>
      </div>

      {/* Setup Completion Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">Setup completion</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
            {setupPercent}%
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${setupPercent}%` }}
          />
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
          <span className="text-xs text-muted-foreground font-mono">
            {selectedRows.length} items
          </span>
        </button>
      </div>

      {/* Required Providers Checklist */}
      <div className="space-y-2 pt-2 border-t border-border">
        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Required
        </h4>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isMdbListValid ? (
                <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <div className="size-2 rounded-full bg-amber-500 ml-0.5 mr-1" />
              )}
              <span
                className={isMdbListValid ? 'text-foreground font-medium' : 'text-muted-foreground'}
              >
                MDBList
              </span>
            </div>
            {!isMdbListValid && (
              <span className="text-[10px] text-amber-500 font-medium">Missing</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isTmdbValid ? (
                <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <div className="size-2 rounded-full bg-amber-500 ml-0.5 mr-1" />
              )}
              <span
                className={isTmdbValid ? 'text-foreground font-medium' : 'text-muted-foreground'}
              >
                TMDB
              </span>
            </div>
            {!isTmdbValid && (
              <span className="text-[10px] text-amber-500 font-medium">Missing</span>
            )}
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
            {traktConnected ? (
              <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <div className="size-1.5 rounded-full bg-muted-foreground/40 ml-1 mr-1" />
            )}
            <span className={traktConnected ? 'text-foreground' : 'text-muted-foreground'}>
              Trakt
            </span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            {simklConnected ? (
              <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <div className="size-1.5 rounded-full bg-muted-foreground/40 ml-1 mr-1" />
            )}
            <span className={simklConnected ? 'text-foreground' : 'text-muted-foreground'}>
              Simkl
            </span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            {anilistConnected ? (
              <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <div className="size-1.5 rounded-full bg-muted-foreground/40 ml-1 mr-1" />
            )}
            <span className={anilistConnected ? 'text-foreground' : 'text-muted-foreground'}>
              AniList
            </span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            {malConnected ? (
              <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <div className="size-1.5 rounded-full bg-muted-foreground/40 ml-1 mr-1" />
            )}
            <span className={malConnected ? 'text-foreground' : 'text-muted-foreground'}>
              MyAnimeList
            </span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            {tmdbAccountConnected ? (
              <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <div className="size-1.5 rounded-full bg-muted-foreground/40 ml-1 mr-1" />
            )}
            <span className={tmdbAccountConnected ? 'text-foreground' : 'text-muted-foreground'}>
              TMDB Account
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            {aiConfigured ? (
              <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Sparkles className="size-3.5 text-purple-500 dark:text-purple-400" />
            )}
            <span className={aiConfigured ? 'text-foreground' : 'text-muted-foreground'}>
              AI Recommendations
            </span>
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
            <div className="text-foreground font-mono font-bold text-base">
              {selectedRows.length}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-background border border-border">
            <div className="text-muted-foreground text-[10px]">Collections</div>
            <div className="text-foreground font-mono font-bold text-base">
              {collections.length}
            </div>
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
  )
}
