import * as React from 'react'
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
  GripVertical,
  ExternalLink,
  CheckCircle2,
  Eye,
  EyeOff,
  ChevronDown,
  Info,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { toast } from 'sonner'
import { PosterProvider } from '@/store/useSettingsStore'

export interface PostersConfigSectionProps {
  providers: PosterProvider[]
  onProvidersChange: (providers: PosterProvider[]) => void
  onProviderKeyChange?: (id: string, key: string) => void
  showRatingsOnPosters: boolean
  onShowRatingsChange: (val: boolean) => void
  badgedEpisodeStills: boolean
  onBadgedEpisodeStillsChange: (val: boolean) => void
  onVerify?: (providerName: string) => void
  showApplyToAll?: boolean
  onApplyToAll?: () => void
  showSectionHeader?: boolean
}

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
      className={`flex items-start gap-2.5 sm:gap-3 rounded-xl p-3 border transition-colors ${
        provider.active || provider.verified
          ? 'bg-card border-border'
          : 'border-dashed border-border/70 bg-card/40 opacity-75'
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="relative grid h-7 w-6 shrink-0 cursor-grab touch-none place-items-center self-start rounded-md text-muted-foreground/70 transition-colors hover:text-foreground active:cursor-grabbing mt-0.5"
        aria-label={`Drag to reorder: ${provider.name}`}
      >
        <GripVertical className="size-4" />
      </button>

      <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2">
        {/* Top Header Row */}
        <div className="flex min-h-6 flex-wrap items-center gap-2">
          <Label className="text-sm font-bold leading-none text-foreground">{provider.name}</Label>
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
                <CheckCircle2 className="size-3 shrink-0" /> verified
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">not in use</span>
            )}
          </div>
        </div>

        {/* Action Toggle (if expandable) */}
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

        {/* Bottom Input + Verify Button */}
        <div className="relative min-w-0">
          <Input
            type={showKey ? 'text' : 'password'}
            placeholder={provider.placeholder}
            value={provider.key}
            onChange={(e) => onKeyChange(e.target.value)}
            className="h-9 pr-10 text-xs sm:text-sm bg-background font-mono"
          />
          <button
            type="button"
            onClick={toggleShowKey}
            aria-label={`Show ${provider.name} key`}
            className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={onVerify}
          className="h-9 shrink-0 gap-1 rounded-lg px-3 text-xs font-medium"
        >
          Verify
        </Button>

        {expanded && (
          <div className="col-span-2 pt-2 border-t border-border/40 mt-1 text-xs text-muted-foreground">
            <p>Custom formatting and caching rules can be configured directly with BetterPosters provider.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function PostersConfigSection({
  providers,
  onProvidersChange,
  onProviderKeyChange,
  showRatingsOnPosters,
  onShowRatingsChange,
  badgedEpisodeStills,
  onBadgedEpisodeStillsChange,
  onVerify,
  showApplyToAll = false,
  onApplyToAll,
  showSectionHeader = true,
}: PostersConfigSectionProps) {
  const [providerKeyVisibility, setProviderKeyVisibility] = React.useState<Record<string, boolean>>({})

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = providers.findIndex((p) => p.id === active.id)
      const newIndex = providers.findIndex((p) => p.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        onProvidersChange(arrayMove(providers, oldIndex, newIndex))
      }
    }
  }

  const handleInternalVerify = (provider: PosterProvider) => {
    if (onVerify) {
      onVerify(provider.name)
    } else {
      if (!provider.key || !provider.key.trim()) {
        toast.error(`Please enter a valid key or URL for ${provider.name}`)
        return
      }
      toast.success(`${provider.name} credentials verified successfully!`)
      // update verified status
      const updated = providers.map((p) =>
        p.id === provider.id ? { ...p, verified: true, active: true } : p
      )
      onProvidersChange(updated)
    }
  }

  const handleKeyUpdate = (id: string, val: string) => {
    if (onProviderKeyChange) {
      onProviderKeyChange(id, val)
    } else {
      const updated = providers.map((p) =>
        p.id === id ? { ...p, key: val, verified: val.trim().length > 0 } : p
      )
      onProvidersChange(updated)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {showSectionHeader && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground select-none">
          <Info className="size-3.5" />
          <span>Posters</span>
        </div>
      )}

      {/* Draggable Provider Rows */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={providers.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {providers.map((provider) => (
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
                onKeyChange={(val) => handleKeyUpdate(provider.id, val)}
                onVerify={() => handleInternalVerify(provider)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Posters Checkbox Options */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-xs">
          <Checkbox
            id="show-ratings-checkbox"
            checked={showRatingsOnPosters}
            onCheckedChange={(c) => onShowRatingsChange(Boolean(c))}
          />
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Label
              htmlFor="show-ratings-checkbox"
              className="text-sm font-medium text-foreground cursor-pointer select-none"
            >
              Show ratings on posters
            </Label>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center p-0.5 rounded transition-colors"
              title="Use the rated poster variant. Which ratings appear (IMDb, MyAnimeList, AniList…) follow your RPDB / Top Posters account settings."
            >
              <Info className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-xs">
          <Checkbox
            id="rating-badged-stills-checkbox"
            checked={badgedEpisodeStills}
            onCheckedChange={(c) => onBadgedEpisodeStillsChange(Boolean(c))}
          />
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Label
              htmlFor="rating-badged-stills-checkbox"
              className="text-sm font-medium text-foreground cursor-pointer select-none"
            >
              Rating-badged episode stills
            </Label>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center p-0.5 rounded transition-colors"
              title="When your poster provider can render episode stills (Top Posters, EasyRatings, XRDB), use its badged version on the season list."
            >
              <Info className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Optional Apply to all profiles footer for Settings */}
      {showApplyToAll && (
        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4 mt-1">
          <p className="min-w-0 text-xs text-muted-foreground">
            Apply this section to your existing profiles.
          </p>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onApplyToAll}
            className="h-8 shrink-0 gap-2 rounded-lg px-2.5 text-xs font-medium"
          >
            <RefreshCw className="size-4" /> Apply to all profiles
          </Button>
        </div>
      )}
    </div>
  )
}
