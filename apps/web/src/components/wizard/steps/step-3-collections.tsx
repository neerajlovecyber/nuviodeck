import * as React from 'react'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { useWizard } from '../wizard-context'

export function Step3Collections() {
  const { collections, setCollections } = useWizard()

  return (
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
        <Button size="sm" className="text-xs gap-1.5 cursor-pointer">
          <Plus className="size-3.5" />
          Add collection
        </Button>
        <Button variant="outline" size="sm" className="text-xs cursor-pointer">
          Load preset
        </Button>
        <Button variant="outline" size="sm" className="text-xs cursor-pointer">
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
                  <label
                    key={value}
                    className="flex items-center gap-2 text-xs text-foreground cursor-pointer"
                  >
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
                    className={`py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      col.viewMode === value
                        ? 'bg-accent text-accent-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Backdrop URL */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground font-semibold">
                Backdrop Image URL
              </Label>
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
              <Label className="text-xs text-muted-foreground font-semibold">
                Folder Previews
              </Label>
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
  )
}
