import * as React from 'react'
import {
  ChevronDown,
  ChevronsUpDown,
  Layers,
  ListPlus,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
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
import { toast } from 'sonner'
import { CatalogItem, getPresetRows } from '@/data/catalog-data'
import { useWizard } from '../wizard-context'

export function Step2HomeRows() {
  const {
    activePresets,
    activeCategories,
    selectedRows,
    setSelectedRows,
    catalogSearch,
    setCatalogSearch,
    expandedCategories,
    toggleCategory,
    toggleAllCategories,
    handleClearCategory,
    handleSelectAllCategory,
    toggleRow,
    getFilterCount,
    setArrangeHomeOpen,
    setEditingRow,
    setAiPromptOpen,
    setCustomListOpen,
    rowFilters,
  } = useWizard()

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in-50 duration-200">
      {/* Desktop Section Header */}
      <header className="hidden shrink-0 items-start justify-between gap-3 border-b border-border pb-4 lg:flex">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
            Home rows
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Pick rows for the Nuvio home screen. Suggested around 15. Reorder them anytime with{' '}
            <button
              type="button"
              onClick={() => setArrangeHomeOpen(true)}
              className="cursor-pointer font-medium text-primary underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
            >
              Arrange home
            </button>
            .
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium shrink-0 border-border bg-background hover:bg-muted cursor-pointer"
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
                  const rows = getPresetRows(preset.id, activeCategories)
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
          <span
            className="text-sm font-medium tabular-nums text-muted-foreground"
            data-testid="home-row-cap-count"
          >
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
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
            Home rows
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Pick rows for the Nuvio home screen. Suggested around 15. Reorder them anytime with{' '}
            <button
              type="button"
              onClick={() => setArrangeHomeOpen(true)}
              className="cursor-pointer font-medium text-primary underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
            >
              Arrange home
            </button>
            .
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
                        className="h-10 px-2.5 text-xs gap-1 border-border bg-background cursor-pointer"
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
                        className="text-xs py-2 cursor-pointer"
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
                className="size-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
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
                className="size-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
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
                className="size-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
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
                <section
                  key={cat.id}
                  className="flex flex-col border border-border/70 rounded-xl bg-card/60 overflow-hidden"
                >
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
                                {item.type === 'movie'
                                  ? 'Movies'
                                  : item.type === 'series'
                                  ? 'Series'
                                  : 'Both'}
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

        {/* Right Column: Selected Rows Rail */}
        <aside
          className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shrink-0 lg:w-80 xl:w-96 max-h-[780px]"
          aria-label="Selected rows"
        >
          <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 bg-card/90">
            <h3 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Selected
            </h3>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-medium tabular-nums ${
                  selectedRows.length > 15
                    ? 'text-amber-500 font-semibold'
                    : 'text-muted-foreground'
                }`}
                title={
                  selectedRows.length > 15
                    ? `${selectedRows.length - 15} over the suggested 15`
                    : undefined
                }
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
  )
}
