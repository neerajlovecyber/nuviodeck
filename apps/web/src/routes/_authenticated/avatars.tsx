import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@workspace/ui/components/dropdown-menu"
import { useAppStore } from "@/store/useStore"
import { toast } from "sonner"
import rawAvatars from "@/data/avatars.json"
import {
  Search,
  SlidersHorizontal,
  Copy,
  Check,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react"

export const Route = createFileRoute("/_authenticated/avatars")({
  component: AvatarsPage,
})

interface AvatarItem {
  id: string
  name: string
  category: string
  collection: string
  localUrl: string
  remoteUrl: string
  tags: string[]
}

const avatarsData = rawAvatars as AvatarItem[]

// Extract actual categories present in data
const existingCategories = Array.from(
  new Set(avatarsData.map((a) => a.category).filter(Boolean))
)

// Preferred order for top categories (only include if they actually exist in avatarsData)
const preferredOrder = [
  "Marvel",
  "Disney",
  "Star Wars",
  "Pixar",
  "Bluey",
  "SpongeBob SquarePants",
  "Stranger Things",
  "Cobra Kai",
  "Sonic Prime",
  "Justice League Unlimited",
  "Footballers",
  "The Classics",
]

const quickFilterCategories = [
  "All",
  ...preferredOrder.filter((cat) => existingCategories.includes(cat)),
]

const allCategories = [
  "All",
  ...preferredOrder.filter((cat) => existingCategories.includes(cat)),
  ...existingCategories
    .filter((cat) => !preferredOrder.includes(cat))
    .sort((a, b) => a.localeCompare(b)),
]

function AvatarsPage() {
  const { user, setAvatar } = useAppStore()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState("All")
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [visibleCount, setVisibleCount] = React.useState(72)

  // Filter avatars based on search and category
  const filteredAvatars = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return avatarsData.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" ||
        item.category.toLowerCase() === selectedCategory.toLowerCase()

      if (!matchesCategory) return false
      if (!q) return true

      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [searchQuery, selectedCategory])

  // Reset pagination when filter changes
  React.useEffect(() => {
    setVisibleCount(72)
  }, [searchQuery, selectedCategory])

  // Helper to build resolved URL
  const getAvatarUrl = React.useCallback((item: AvatarItem) => {
    if (item.remoteUrl) {
      return item.remoteUrl
    }
    if (typeof window !== "undefined") {
      return `${window.location.origin}${item.localUrl}`
    }
    return item.localUrl
  }, [])

  const handleCopyUrl = (item: AvatarItem, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const url = getAvatarUrl(item)
    navigator.clipboard.writeText(url)
    setCopiedId(item.id)
    toast.success(`Copied "${item.name}" URL to clipboard!`, {
      description: "Paste it into the Custom avatar URL field in your profile.",
    })
    setTimeout(() => {
      setCopiedId((prev) => (prev === item.id ? null : prev))
    }, 2000)
  }

  const handleApplyAvatar = (item: AvatarItem, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setAvatar(item.localUrl)
    toast.success(`Profile avatar updated to ${item.name}!`, {
      description: "Your sidebar and profile avatar have been updated.",
    })
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--header-height": "3.5rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <div className="flex flex-1 flex-col">
          <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header section matching reference design */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                    Avatars
                  </h1>
                  <div className="text-muted-foreground text-sm sm:text-base mt-2 space-y-1">
                    <p>Tap an avatar to copy its image URL, then paste it into Nuvio.</p>
                    <p className="text-xs sm:text-sm text-muted-foreground/80">
                      In Nuvio: open your profile, tap Edit, then paste into the{" "}
                      <span className="text-foreground font-medium">Custom avatar URL</span> field.
                    </p>
                  </div>
                </div>
              </div>

              {/* Search bar & Category filter */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search avatars by character, show, or tags..."
                    className="pl-10 pr-10 h-11 bg-card/60 rounded-xl border-border/80 focus-visible:ring-1"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>

                {/* Filter Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        className="h-11 px-4 rounded-xl border-border/80 bg-card/60 flex items-center gap-2 font-medium shrink-0"
                      >
                        <SlidersHorizontal className="size-4 text-muted-foreground" />
                        <span>{selectedCategory}</span>
                        <Badge variant="secondary" className="ml-1 rounded-full px-1.5 text-[10px]">
                          {filteredAvatars.length}
                        </Badge>
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto rounded-xl">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Filter by Collection / Show</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {allCategories.map((cat) => (
                        <DropdownMenuItem
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`cursor-pointer justify-between ${
                            selectedCategory === cat ? "bg-accent font-semibold text-primary" : ""
                          }`}
                        >
                          <span>{cat}</span>
                          {selectedCategory === cat && <Check className="size-4 text-primary" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Quick Filter Pills for popular shows */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
                {quickFilterCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-card/70 border-border/70 text-muted-foreground hover:text-foreground hover:bg-card"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Results count & active avatar summary */}
            <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-3">
              <span>
                Showing {Math.min(visibleCount, filteredAvatars.length)} of {filteredAvatars.length} avatars
              </span>
              {user?.avatar && (
                <div className="flex items-center gap-2">
                  <span>Current avatar:</span>
                  <img
                    src={user.avatar}
                    alt="Active"
                    className="size-5 rounded-full object-cover ring-1 ring-border"
                  />
                </div>
              )}
            </div>

            {/* Avatar Grid */}
            {filteredAvatars.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="size-16 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                  <Search className="size-8" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">No avatars found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your search query or switching the category filter.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("All")
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-x-4 gap-y-8">
                {filteredAvatars.slice(0, visibleCount).map((item) => {
                  const isCurrentAvatar = user?.avatar === item.localUrl
                  const isCopied = copiedId === item.id

                  return (
                    <div
                      key={item.id}
                      className="group flex flex-col items-center text-center relative"
                    >
                      {/* Avatar Image Container */}
                      <div
                        onClick={(e) => handleCopyUrl(item, e)}
                        title="Click to copy image URL"
                        className="relative cursor-pointer transition-transform duration-200 group-hover:scale-105 active:scale-95"
                      >
                        <div
                          className={`size-24 sm:size-28 rounded-full p-1 bg-gradient-to-b from-card/80 to-card transition-all duration-200 shadow-sm ${
                            isCurrentAvatar
                              ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                              : "ring-1 ring-border/60 group-hover:ring-primary/50 group-hover:shadow-md"
                          }`}
                        >
                          <img
                            src={item.localUrl}
                            alt={item.name}
                            loading="lazy"
                            className="size-full rounded-full object-cover bg-neutral-900"
                          />
                        </div>

                        {/* Active avatar check badge */}
                        {isCurrentAvatar && (
                          <div
                            title="Active Profile Avatar"
                            className="absolute -top-1 -right-1 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md ring-2 ring-background"
                          >
                            <UserCheck className="size-3.5" />
                          </div>
                        )}

                        {/* Copy feedback overlay */}
                        {isCopied && (
                          <div className="absolute inset-0 rounded-full bg-primary/80 backdrop-blur-xs flex flex-col items-center justify-center text-primary-foreground animate-in fade-in zoom-in-95 duration-150">
                            <Check className="size-6" />
                            <span className="text-[10px] font-bold tracking-tight mt-0.5">COPIED</span>
                          </div>
                        )}
                      </div>

                      {/* Character / Avatar Name */}
                      <span className="mt-2.5 text-xs font-medium text-foreground/90 line-clamp-1 w-full px-1 tracking-tight">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1 w-full px-1">
                        {item.category}
                      </span>

                      {/* Action buttons matching screenshot */}
                      <div className="mt-2 flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleCopyUrl(item, e)}
                          title="Copy image URL"
                          className={`size-8 rounded-lg transition-colors ${
                            isCopied
                              ? "bg-primary/20 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          }`}
                        >
                          {isCopied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                          <span className="sr-only">Copy URL</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleApplyAvatar(item, e)}
                          title={isCurrentAvatar ? "Current Profile Avatar" : "Set as Profile Avatar"}
                          className={`size-8 rounded-lg transition-colors ${
                            isCurrentAvatar
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          }`}
                        >
                          {isCurrentAvatar ? (
                            <UserCheck className="size-3.5" />
                          ) : (
                            <UserPlus className="size-3.5" />
                          )}
                          <span className="sr-only">Set as Avatar</span>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Load more button if there are remaining avatars */}
            {visibleCount < filteredAvatars.length && (
              <div className="flex justify-center pt-8 pb-12">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setVisibleCount((prev) => prev + 72)}
                  className="rounded-full px-8 font-medium shadow-xs"
                >
                  Load More ({filteredAvatars.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
