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
import { toast } from "sonner"
import signatureSetsData from "@/data/badge-sets-signature.json"
import {
  Tag,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Tv,
  Smartphone,
  Play,
  Search,
  Info,
} from "lucide-react"

export const Route = createFileRoute("/_authenticated/badges")({
  component: BadgesPage,
})

export interface BadgeItem {
  id: string
  name: string
  pattern?: string
  groupId?: string
  imageURL: string
  tagColor?: string
  borderColor?: string
  textColor?: string
  tagStyle?: string
  isEnabled?: boolean
  type?: string
}

export interface BadgeGroup {
  id: string
  name: string
  color?: string
  borderColor?: string
}

export interface BadgeSet {
  id: string
  label: string
  creator: string
  style: string
  description?: string
  signature?: boolean
  favorite?: boolean
  sampleIds?: string[]
  badgeCount?: number
  curatedSamples?: BadgeItem[]
  groups?: BadgeGroup[]
  badges: BadgeItem[]
}

const DEFAULT_PRESET_FILENAME =
  "Example.Movie.2026.2160p.WEB-DL.REMUX.DV.HDR10Plus.Atmos.TrueHD.7.1.NFLX.HMAX.x265"

// Safe regex test utility handling (?i)
function testBadgePattern(pattern?: string, filename?: string): boolean {
  if (!pattern || !filename) return false
  let cleanPattern = pattern.trim()
  if (cleanPattern.startsWith("(?i)")) {
    cleanPattern = cleanPattern.slice(4)
  }
  try {
    const reg = new RegExp(cleanPattern, "i")
    return reg.test(filename)
  } catch {
    return false
  }
}

// Convert #AARRGGBB or standard hex to valid CSS rgba/hex with visibility preservation
function parseAARRGGBB(hex?: string): string {
  if (!hex || hex === "#00000000") return "transparent"
  if (hex.startsWith("#") && hex.length === 9) {
    let a = parseInt(hex.slice(1, 3), 16) / 255
    const r = parseInt(hex.slice(3, 5), 16)
    const g = parseInt(hex.slice(5, 7), 16)
    const b = parseInt(hex.slice(7, 9), 16)
    // Boost subtle borders like #24FFFFFF (14%) to 28% so hairline borders are clearly visible on dark cards
    if (a > 0 && a < 0.22) {
      a = 0.28
    }
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`
  }
  return hex
}

// Component to render individual badge with full CSS chip styling (Spectrum, Onyx, Wire, Ghost, etc.)
function BadgeChip({
  badge,
  size = "sm",
  onClick,
  title,
}: {
  badge: BadgeItem
  size?: "sm" | "md" | "lg"
  onClick?: () => void
  title?: string
}) {
  const bgColor = parseAARRGGBB(badge.tagColor)
  const borderColor = parseAARRGGBB(badge.borderColor)

  // A badge is a bordered chip ONLY if borderColor is non-transparent
  const isBordered =
    Boolean(borderColor) &&
    borderColor !== "transparent" &&
    borderColor !== "#00000000"

  // A badge is a filled chip ONLY if bgColor is non-transparent
  const isFilled =
    Boolean(bgColor) &&
    bgColor !== "transparent" &&
    bgColor !== "#00000000"

  const isLg = size === "lg"
  const isMd = size === "md"
  const isInteractive = isLg || isMd

  // If badge uses CSS chip styling (Spectrum solid color, Onyx dark mono, Wire colored outline)
  if (isFilled || isBordered) {
    const chipStyle: React.CSSProperties = {
      backgroundColor: isFilled ? bgColor : "transparent",
      borderColor: isBordered ? borderColor : "transparent",
      borderWidth: isBordered ? "1.5px" : "0px",
      borderStyle: isBordered ? "solid" : "none",
    }

    const containerClasses = isLg
      ? "h-9 sm:h-9.5 px-1.5 py-0.5 rounded-md cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
      : isMd
        ? "h-8 sm:h-8.5 px-1.5 py-0.5 rounded-md cursor-pointer hover:scale-105 active:scale-95 shadow-xs"
        : "h-[25px] max-h-[25px] px-1 py-0.5 rounded-[5px]"

    const imgClasses = isLg
      ? "h-6 sm:h-6.5 max-h-7 max-w-[130px]"
      : isMd
        ? "h-5 sm:h-5.5 max-h-6 max-w-[110px]"
        : "h-4 max-h-[17px] max-w-[75px]"

    return (
      <div
        style={chipStyle}
        onClick={onClick}
        title={title}
        className={`inline-flex items-center justify-center shrink-0 transition-all ${containerClasses}`}
      >
        <img
          src={badge.imageURL}
          alt={badge.name}
          loading="lazy"
          className={`${imgClasses} w-auto object-contain shrink-0 drop-shadow-xs`}
        />
      </div>
    )
  }

  // Self-contained graphic badges (Aurora frosted glass, Pulse neon outline, Prism gradient) or Ghost (logo-only)
  const isGhost = badge.imageURL?.includes("xp_white")
  const graphicClasses = isLg
    ? isGhost
      ? "h-7 sm:h-7.5 max-w-[130px] drop-shadow-xs"
      : "h-9 sm:h-9.5 max-w-[150px] rounded-md drop-shadow-xs"
    : isMd
      ? isGhost
        ? "h-6 sm:h-6.5 max-w-[110px] drop-shadow-xs"
        : "h-8 sm:h-8.5 max-w-[130px] rounded-md drop-shadow-xs"
      : isGhost
        ? "h-[20px] max-h-[20px] max-w-[85px] object-contain drop-shadow-xs"
        : "h-[25px] max-h-[25px] max-w-[90px] object-contain drop-shadow-xs"

  return (
    <div
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center shrink-0 ${
        isInteractive ? "cursor-pointer hover:scale-105 active:scale-95" : ""
      }`}
    >
      <img
        src={badge.imageURL}
        alt={badge.name}
        loading="lazy"
        className={`${graphicClasses} w-auto object-contain shrink-0`}
      />
    </div>
  )
}

// Pick authentic showcase badges (Resolution: 4K, Audio: Atmos, Streaming: Netflix, or Quality: Remux, BluRay)
function getSampleBadges(set: BadgeSet, maxCount = 3): BadgeItem[] {
  if (!set || !set.badges || set.badges.length === 0) return []

  const b4k = set.badges.find(
    (b) => b.id === "r-4k" || b.id === "4k" || b.name.toLowerCase() === "4k"
  )
  const bAudio = set.badges.find(
    (b) =>
      b.id === "a-atmos" ||
      b.id === "a-atmos-dv" ||
      b.id.includes("atmos") ||
      b.name.toLowerCase().includes("atmos")
  )
  const bStream = set.badges.find(
    (b) =>
      b.id === "p-netflix" ||
      b.id === "s-nflx" ||
      b.id.includes("netflix") ||
      b.name.toLowerCase().includes("netflix")
  )
  const bRemux = set.badges.find(
    (b) => b.id.includes("remux") || b.name.toLowerCase().includes("remux")
  )
  const bBluray = set.badges.find(
    (b) => b.id.includes("bluray") || b.name.toLowerCase().includes("bluray")
  )

  // Signature sets always showcase: [4K, Atmos, Netflix]
  if (set.signature) {
    const signaturePicks = [b4k, bAudio, bStream].filter((b): b is BadgeItem =>
      Boolean(b)
    )
    if (signaturePicks.length >= 2) return signaturePicks.slice(0, maxCount)
  }

  // If the set has Remux + BluRay (e.g. Mono Logos, Dark Logos, Studio Starter)
  if (
    bRemux &&
    bBluray &&
    (set.id.includes("mousaa") ||
      set.id.includes("elite") ||
      set.id.includes("ngrey") ||
      set.id.includes("voidxo"))
  ) {
    return [bRemux, bBluray].slice(0, maxCount)
  }

  // Standard diverse picks: [4K, Atmos, Netflix]
  const standardPicks = [b4k, bAudio, bStream].filter((b): b is BadgeItem =>
    Boolean(b)
  )
  if (standardPicks.length >= 2) return standardPicks.slice(0, maxCount)

  // Alternative [Remux, BluRay, 4K]
  const alt = [bRemux, bBluray, b4k].filter((b): b is BadgeItem => Boolean(b))
  if (alt.length >= 2) return alt.slice(0, maxCount)

  return set.badges.slice(0, maxCount)
}

function BadgesPage() {
  const [allSets, setAllSets] = React.useState<BadgeSet[]>(
    signatureSetsData as BadgeSet[]
  )
  const [activeSetId, setActiveSetId] = React.useState<string>("xp_spectrum")
  const [testFilename, setTestFilename] = React.useState<string>(
    DEFAULT_PRESET_FILENAME
  )
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [activeCategoryFilter, setActiveCategoryFilter] =
    React.useState<string>("all")
  const [copiedUrl, setCopiedUrl] = React.useState<boolean>(false)

  // Synchronize card preview badges using official curated samples, sized perfectly so nothing gets cut off
  const getCardBadges = React.useCallback((set: BadgeSet) => {
    if (set.curatedSamples && set.curatedSamples.length > 0) {
      if (set.signature) {
        return set.curatedSamples.slice(0, 3)
      }
      // For community sets: Kingsize, concise, and minimalist look great with 3.
      // Wide badges (Remux, BluRay, SeaDex, DIR CUT, Best Remux) show 2 so they fit cleanly without clipping
      const isCompact =
        set.id.startsWith("kingsize") ||
        set.id.includes("concise") ||
        set.id.includes("minimal") ||
        set.id.includes("black_white")

      return set.curatedSamples.slice(0, isCompact ? 3 : 2)
    }

    return getSampleBadges(set, set.signature ? 3 : 2)
  }, [])

  // Load all 32 badge sets from /xperience-badge-sets.json on mount
  React.useEffect(() => {
    fetch("/xperience-badge-sets.json")
      .then((res) => res.json())
      .then((data: BadgeSet[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setAllSets(data)
        }
      })
      .catch((err) => {
        console.warn("Could not load full badge sets, using signature sets:", err)
      })
  }, [])

  // Get active selected set
  const activeSet = React.useMemo(() => {
    return allSets.find((s) => s.id === activeSetId) || allSets[0] || null
  }, [allSets, activeSetId])

  // Compute matched badges in the current active set against the test filename
  const matchedBadges = React.useMemo(() => {
    if (!activeSet || !activeSet.badges) return []
    return activeSet.badges.filter((b) =>
      testBadgePattern(b.pattern, testFilename)
    )
  }, [activeSet, testFilename])

  // Filter all sets into one combined list
  const filteredSets = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return allSets.filter((s) => {
      const matchesSearch =
        !q ||
        s.label.toLowerCase().includes(q) ||
        s.creator.toLowerCase().includes(q) ||
        s.style.toLowerCase().includes(q)

      if (!matchesSearch) return false

      if (activeCategoryFilter === "favorites") return s.favorite
      if (activeCategoryFilter === "image")
        return (
          s.style.toLowerCase().includes("logo") ||
          s.style.toLowerCase().includes("image")
        )
      if (activeCategoryFilter === "text")
        return (
          s.style.toLowerCase().includes("text") ||
          s.style.toLowerCase().includes("minimal")
        )
      return true
    })
  }, [allSets, searchQuery, activeCategoryFilter])

  // Published badge URL for Nuvio
  const publishedUrl = React.useMemo(() => {
    if (!activeSet) return "https://cdn.xperience-app.com/badges/xp_spectrum"
    return `https://cdn.xperience-app.com/badges/${activeSet.id}`
  }, [activeSet])

  const handleCopyUrl = (urlToCopy?: string) => {
    const target = urlToCopy || publishedUrl
    navigator.clipboard.writeText(target)
    setCopiedUrl(true)
    toast.success("Nuvio badge URL copied!", {
      description: "Paste it directly in Nuvio TV or Mobile settings.",
    })
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const handlePushToNuvio = () => {
    navigator.clipboard.writeText(publishedUrl)
    setCopiedUrl(true)
    toast.success("Pushed to Nuvio!", {
      description: `Active pack "${activeSet?.label}" URL copied. Ready to sync with your Nuvio devices.`,
    })
    setTimeout(() => setCopiedUrl(false), 2000)
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
        <SiteHeader title="Badges" />
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 md:px-10 lg:px-12 space-y-8">
          {/* Page Header */}
            <div className="border-b pb-6 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                  <Tag className="size-5" />
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                  Badges
                </h1>
              </div>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Build a custom Nuvio stream-badge pack from curated sets, test stream title patterns in real time, and publish a link to paste into Nuvio.
              </p>
            </div>

            {/* Main Content Layout: Live Preview & Badge Sets on Left (8 Cols), Studio / Publish on Right (4 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Live Preview & Badge Sets (8 Cols) */}
              <div className="lg:col-span-8 space-y-6">
                {/* Live Preview & Stream Matcher */}
                <div className="rounded-2xl border border-border/80 bg-card/50 backdrop-blur-sm p-4 sm:p-5 shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Live preview
                      </span>
                      <Badge variant="secondary" className="rounded-full px-2 text-[11px] font-semibold">
                        {activeSet?.label} Set
                      </Badge>
                    </div>
                    <Badge
                      variant="outline"
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary border-primary/20"
                    >
                      {matchedBadges.length} badges
                    </Badge>
                  </div>

                  {/* Stream Title Test Input */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground font-mono text-xs">
                      <Play className="size-3.5 fill-current text-primary" />
                    </div>
                    <Input
                      value={testFilename}
                      onChange={(e) => setTestFilename(e.target.value)}
                      placeholder="Enter stream filename (e.g. 2160p.WEB-DL.HDR.Atmos)..."
                      className="pl-9 font-mono text-xs sm:text-sm h-10 bg-background/80 border-border/80 rounded-xl focus-visible:ring-primary/40"
                    />
                  </div>

                  {/* Live Rendered Badge Row */}
                  <div className="p-1.5 sm:p-2 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center min-h-[42px] overflow-hidden">
                    {matchedBadges.length === 0 ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground italic px-1">
                        <Info className="size-4 text-muted-foreground/80" />
                        <span>No badges matched this stream filename. Try typing "2160p", "Remux", "HDR", or "Atmos".</span>
                      </div>
                    ) : (
                      <div
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                        className="flex flex-nowrap items-center gap-1.5 sm:gap-2 w-full overflow-x-auto py-0.5 no-scrollbar [&::-webkit-scrollbar]:hidden"
                      >
                        {matchedBadges.map((b) => (
                          <BadgeChip
                            key={b.id}
                            badge={b}
                            size="lg"
                            title={`${b.name} (${b.id})\nPattern: ${b.pattern || "N/A"}`}
                            onClick={() => {
                              navigator.clipboard.writeText(b.imageURL)
                              toast.success(`Copied "${b.name}" image URL!`)
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Unified Badge Sets Section */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" />
                      <h2 className="text-base font-semibold tracking-tight text-foreground">
                        Badge Sets
                      </h2>
                      <Badge variant="secondary" className="rounded-full text-[11px] px-2 py-0">
                        {filteredSets.length}
                      </Badge>
                    </div>

                    {/* Filter / Search Bar */}
                    <div className="flex items-center gap-2">
                      <div className="relative w-44 sm:w-56">
                        <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search badge sets..."
                          className="h-8 pl-8 text-xs rounded-lg"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        {["all", "favorites", "image"].map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setActiveCategoryFilter(f)}
                            className={`px-2 py-1 rounded-md text-[11px] font-medium capitalize transition-colors ${
                              activeCategoryFilter === f
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Unified Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                    {filteredSets.map((s) => {
                      const isActive = s.id === activeSetId
                      const sampleBadges = getCardBadges(s)

                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            setActiveSetId(s.id)
                            toast.success(`Switched to "${s.label}" badge set`)
                          }}
                          className={`group relative flex flex-col justify-between p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                            isActive
                              ? "bg-primary/10 border-primary/60 shadow-md ring-1 ring-primary/40"
                              : "bg-card/70 border-border/70 hover:border-border hover:bg-card/90"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-sm font-semibold text-foreground truncate">
                                {s.label}
                              </span>
                              {s.signature ? (
                                <Sparkles className="size-3 text-primary/70 shrink-0" />
                              ) : s.favorite ? (
                                <span className="text-amber-400 text-xs shrink-0">★</span>
                              ) : null}
                            </div>
                            {isActive && (
                              <Badge className="h-5 px-1.5 text-[10px] font-semibold bg-primary text-primary-foreground shrink-0">
                                Active
                              </Badge>
                            )}
                          </div>

                          {/* Previews */}
                          <div className="mt-2.5 py-1 px-1.5 rounded-lg bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-1 min-h-[36px] shadow-inner">
                            <div className="flex items-center gap-1 overflow-hidden">
                              {sampleBadges.map((b) => (
                                <BadgeChip key={b.id} badge={b} size="sm" />
                              ))}
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground shrink-0 pl-0.5 pr-0.5">
                              +{s.badges.length - sampleBadges.length}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Studio Controls, Nuvio Integration, Saved Packs (4 Cols) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Nuvio Badge URL Card */}
                <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm p-5 space-y-4 shadow-sm">
                  {/* Your Nuvio badge URL */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">
                        Your Nuvio badge URL
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Active: <strong className="text-foreground font-medium">{activeSet?.label}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={publishedUrl}
                        className="h-9 font-mono text-xs bg-muted/50 border-border/80 rounded-lg selection:bg-primary selection:text-primary-foreground"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyUrl()}
                        className="size-9 rounded-lg shrink-0"
                      >
                        {copiedUrl ? (
                          <Check className="size-4 text-primary" />
                        ) : (
                          <Copy className="size-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Saved. Nuvio will pick up changes on its next refresh.
                    </p>
                  </div>

                  {/* How to use in Nuvio Guide */}
                  <div className="pt-3 border-t border-border/60 space-y-2.5">
                    <span className="text-xs font-semibold text-foreground block">
                      How to use in Nuvio
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Copy your badge URL above, then paste it in your Nuvio app settings:
                    </p>

                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border/50 text-foreground/90">
                        <div className="flex items-center gap-2">
                          <Tv className="size-3.5 text-primary" />
                          <span>TV: Settings → Layout → Badges</span>
                        </div>
                        <ExternalLink className="size-3 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border/50 text-foreground/90">
                        <div className="flex items-center gap-2">
                          <Smartphone className="size-3.5 text-primary" />
                          <span>Mobile: Settings → Streams → Badges</span>
                        </div>
                        <ExternalLink className="size-3 text-muted-foreground" />
                      </div>
                    </div>

                    <p className="text-[10px] text-muted-foreground/90 leading-normal">
                      Paste the URL, choose Import, then Save. Set the badge position (top or bottom) in the same section.
                    </p>
                  </div>

                  {/* Push to Nuvio Action at bottom of card */}
                  <div className="pt-3 border-t border-border/60 space-y-1.5">
                    <Button
                      onClick={() => handlePushToNuvio()}
                      className="w-full h-10 rounded-xl font-medium shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                    >
                      <Sparkles className="size-4" />
                      <span>Push to Nuvio</span>
                    </Button>
                    <span className="block text-[11px] text-muted-foreground text-center">
                      Publish pack:{" "}
                      <strong className="text-foreground">{activeSet?.label}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </SidebarInset>

    </SidebarProvider>
  )
}
