import * as React from 'react'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import {
  GripVertical,
  ListOrdered,
  ListPlus,
  Play,
  Plus,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { CatalogItem, DEFAULT_COLLECTIONS, getPresetRows } from '@/data/catalog-data'
import { WIZARD_INFO_ITEMS } from '../wizard-constants'
import { useWizard } from '../wizard-context'

function SortableHomeRowItem({ row, onRemove }: { row: CatalogItem; onRemove: () => void }) {
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
        className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors cursor-pointer"
        aria-label={`Remove ${row.name}`}
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

export function WizardDialogs() {
  const {
    arrangeHomeOpen,
    setArrangeHomeOpen,
    selectedRows,
    setSelectedRows,
    activeCategories,
    toggleRow,
    editingRow,
    setEditingRow,
    tempFilters,
    setTempFilters,
    setRowFilters,
    aiPromptOpen,
    setAiPromptOpen,
    aiPromptInput,
    setAiPromptInput,
    handleCreateAiRow,
    customListOpen,
    setCustomListOpen,
    customRowPrefix,
    setCustomRowPrefix,
    customRowType,
    setCustomRowType,
    customRowInput,
    setCustomRowInput,
    handleAddCustomRow,
    previewOpen,
    setPreviewOpen,
    profileName,
    previewMetas,
    connectModalProvider,
    setConnectModalProvider,
    connectModalUsername,
    setConnectModalUsername,
    handleConfirmConnect,
    activeInfoKey,
    setActiveInfoKey,
  } = useWizard()

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

  return (
    <>
      {/* 1. Arrange Home Rows Dialog */}
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
                  <SortableHomeRowItem key={row.id} row={row} onRemove={() => toggleRow(row)} />
                ))}
              </SortableContext>
            </DndContext>
          </div>
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRows(getPresetRows('balanced', activeCategories))}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Reset to Default
            </Button>
            <Button
              size="sm"
              onClick={() => setArrangeHomeOpen(false)}
              className="text-xs px-4 cursor-pointer"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Row Filter Configuration Dialog */}
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
                onChange={(e) =>
                  setTempFilters((prev) => ({ ...prev, customTitle: e.target.value }))
                }
                placeholder={editingRow?.name || 'e.g. Featured Hits'}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Overrides row name on Nuvio home screen.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Min IMDb / TMDB Rating</Label>
                <select
                  value={tempFilters.minRating}
                  onChange={(e) =>
                    setTempFilters((prev) => ({
                      ...prev,
                      minRating: parseFloat(e.target.value),
                    }))
                  }
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
                  onChange={(e) =>
                    setTempFilters((prev) => ({
                      ...prev,
                      minVotes: parseInt(e.target.value, 10),
                    }))
                  }
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
                  onChange={(e) =>
                    setTempFilters((prev) => ({
                      ...prev,
                      yearFrom: parseInt(e.target.value, 10) || 1900,
                    }))
                  }
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
                  onChange={(e) =>
                    setTempFilters((prev) => ({
                      ...prev,
                      yearTo: parseInt(e.target.value, 10) || 2026,
                    }))
                  }
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
              className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
            >
              Clear Filters
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingRow(null)}
                className="text-xs cursor-pointer"
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
                className="text-xs cursor-pointer"
              >
                Save Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. Create with AI Dialog */}
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
              <Label className="text-[11px] text-muted-foreground mb-1.5 block">
                Theme Inspirations
              </Label>
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
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateAiRow}
              disabled={!aiPromptInput.trim()}
              className="text-xs gap-1.5 cursor-pointer"
            >
              <Sparkles className="size-3.5" />
              Generate & Add Row
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 4. Add Custom List Dialog */}
      <Dialog open={customListOpen} onOpenChange={setCustomListOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <ListPlus className="size-4 text-primary" />
              Add Custom Catalog List
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Connect any MDBList public list, or TMDB actor, director, or production company as a
              home row.
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
              className="text-xs cursor-pointer"
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
              className="text-xs gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" />
              Add Row
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. Live Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[900px] bg-card border-border text-foreground p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Play className="size-4 text-emerald-600 dark:text-emerald-400" />
              Live Preview: "{profileName || 'Profile'}" on Nuvio
            </DialogTitle>
          </DialogHeader>

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
                  Paul Atreides unites with Chani and the Fremen while seeking revenge against the
                  conspirators who destroyed his family.
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
                    <span className="font-extrabold text-white text-sm tracking-wider">
                      {f.logoText}
                    </span>
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

      {/* 6. Connect Account Modal */}
      <Dialog
        open={!!connectModalProvider}
        onOpenChange={(open) => !open && setConnectModalProvider(null)}
      >
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base capitalize">
              Connect{' '}
              {connectModalProvider === 'tmdb'
                ? 'TMDB Account'
                : connectModalProvider === 'myanimelist'
                ? 'MyAnimeList'
                : connectModalProvider}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter your account username to link your watchlist, history, and tracking.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {connectModalProvider === 'tmdb'
                  ? 'TMDB Username'
                  : `${connectModalProvider?.toUpperCase()} Username`}
              </label>
              <Input
                placeholder="e.g. moviebuff_99"
                value={connectModalUsername}
                onChange={(e) => setConnectModalUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmConnect()
                }}
                autoFocus
                className="h-10 text-sm"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Linking allows Nuvio to personalize your catalog rows and sync your watch progress
              seamlessly.
            </p>
          </div>
          <DialogFooter className="flex items-center justify-between sm:justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConnectModalProvider(null)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmConnect} className="cursor-pointer">
              Confirm Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. Info Dialog */}
      <Dialog open={!!activeInfoKey} onOpenChange={(open) => !open && setActiveInfoKey(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base">
              {activeInfoKey && WIZARD_INFO_ITEMS[activeInfoKey]?.title}
            </DialogTitle>
            <DialogDescription className="text-xs pt-1 leading-relaxed">
              {activeInfoKey && WIZARD_INFO_ITEMS[activeInfoKey]?.description}
            </DialogDescription>
          </DialogHeader>
          {activeInfoKey && WIZARD_INFO_ITEMS[activeInfoKey]?.detail && (
            <div className="p-3 rounded-xl bg-accent/50 border border-border text-xs text-muted-foreground leading-relaxed">
              {WIZARD_INFO_ITEMS[activeInfoKey].detail}
            </div>
          )}
          <DialogFooter>
            <Button size="sm" onClick={() => setActiveInfoKey(null)} className="cursor-pointer">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
