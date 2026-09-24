import * as React from 'react'
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Play,
  RotateCcw,
  Send,
} from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { toast } from 'sonner'
import { useWizard } from '../wizard-context'

export function Step5Finalize() {
  const {
    profileId,
    profileName,
    selectedRows,
    collections,
    streamsEnabled,
    handlePushToNuvio,
    isPushing,
    sessions,
  } = useWizard()

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-200 py-4">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="size-14 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="size-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
          {profileName || 'Profile'} is ready
        </h2>
        <p className="text-sm text-muted-foreground font-mono">
          {selectedRows.length} home rows · {collections.length} collections · 28 folders ·{' '}
          {streamsEnabled ? 'Streams Enabled' : 'Streams Disabled'} · Language English
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
              One click installs the add-on and pushes your collections, catalog manifests, and
              streams directly to your Nuvio profile.
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
          Pushing to{' '}
          <span className="font-semibold text-foreground">
            {sessions[0]?.email || 'connected Nuvio account'}
          </span>
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
  )
}
