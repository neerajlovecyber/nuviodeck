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
import { Slider } from "@workspace/ui/components/slider"
import { Switch } from "@workspace/ui/components/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs"
import { toast } from "sonner"
import {
  Palette,
  Sparkles,
  Type,
  Sliders,
  Check,
  RotateCcw,
  Download,
  Share2,
  Tv,
  Layers,
  Flame,
  Film,
  Camera,
  Compass,
  Zap,
  Leaf,
  Maximize2,
  RefreshCw,
} from "lucide-react"

export const Route = createFileRoute("/_authenticated/studio")({
  component: CoverStudioPage,
})

interface CoverLook {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  defaultFont: string
  defaultAccent: string
  vignette: number
  grain: number
  scrim: number
  frameWidth: number
  frameRadius: number
  colorMode: 'folder' | 'accent' | 'monochrome'
}

const COVER_LOOKS: CoverLook[] = [
  {
    id: "kaptain",
    name: "Kaptain Cinematic",
    description: "Atmospheric vignette, bold condensed typography, rich folder color wash.",
    icon: <Film className="size-4" />,
    defaultFont: "Bebas Neue",
    defaultAccent: "#e50914",
    vignette: 0.5,
    grain: 0.15,
    scrim: 0.6,
    frameWidth: 0,
    frameRadius: 12,
    colorMode: "folder",
  },
  {
    id: "editorial",
    name: "Editorial Minimalist",
    description: "Clean modern sans-serif typography, subtle scrim, monochrome elegance.",
    icon: <Compass className="size-4" />,
    defaultFont: "Inter",
    defaultAccent: "#ffffff",
    vignette: 0.25,
    grain: 0.05,
    scrim: 0.45,
    frameWidth: 1,
    frameRadius: 10,
    colorMode: "monochrome",
  },
  {
    id: "trending",
    name: "Trending Neon Glow",
    description: "Vibrant neon edges, glowing accent halos, high dynamic contrast.",
    icon: <Flame className="size-4" />,
    defaultFont: "Archivo Black",
    defaultAccent: "#ff007f",
    vignette: 0.4,
    grain: 0.1,
    scrim: 0.5,
    frameWidth: 2,
    frameRadius: 14,
    colorMode: "accent",
  },
  {
    id: "spotlight",
    name: "Character Spotlight",
    description: "Dramatic directional spotlight with deep shadows and cinematic title.",
    icon: <Camera className="size-4" />,
    defaultFont: "Anton",
    defaultAccent: "#eab308",
    vignette: 0.65,
    grain: 0.2,
    scrim: 0.7,
    frameWidth: 0,
    frameRadius: 12,
    colorMode: "folder",
  },
  {
    id: "logomark",
    name: "Platform Logomarks",
    description: "Studio and streamer brand badges with balanced backdrop scrim.",
    icon: <Layers className="size-4" />,
    defaultFont: "Poppins",
    defaultAccent: "#00d2ff",
    vignette: 0.35,
    grain: 0.08,
    scrim: 0.5,
    frameWidth: 1,
    frameRadius: 16,
    colorMode: "accent",
  },
  {
    id: "gradient",
    name: "Procedural Mesh",
    description: "Vibrant multi-stop color gradients that shift per folder category.",
    icon: <Zap className="size-4" />,
    defaultFont: "Cinzel",
    defaultAccent: "#a855f7",
    vignette: 0.2,
    grain: 0.12,
    scrim: 0.4,
    frameWidth: 2,
    frameRadius: 16,
    colorMode: "accent",
  },
  {
    id: "mesh_nature",
    name: "Nature Organic",
    description: "Warm earthy tones, soft natural lighting, and tactile texture.",
    icon: <Leaf className="size-4" />,
    defaultFont: "Playfair Display",
    defaultAccent: "#10b981",
    vignette: 0.3,
    grain: 0.18,
    scrim: 0.55,
    frameWidth: 0,
    frameRadius: 12,
    colorMode: "folder",
  },
]

const GOOGLE_FONTS = [
  { name: "Bebas Neue", family: "'Bebas Neue', sans-serif" },
  { name: "Inter", family: "'Inter', sans-serif" },
  { name: "Archivo Black", family: "'Archivo Black', sans-serif" },
  { name: "Anton", family: "'Anton', sans-serif" },
  { name: "Playfair Display", family: "'Playfair Display', serif" },
  { name: "Cinzel", family: "'Cinzel', serif" },
  { name: "Oswald", family: "'Oswald', sans-serif" },
  { name: "Montserrat", family: "'Montserrat', sans-serif" },
  { name: "Poppins", family: "'Poppins', sans-serif" },
  { name: "Barlow Condensed", family: "'Barlow Condensed', sans-serif" },
  { name: "Roboto Condensed", family: "'Roboto Condensed', sans-serif" },
]

const SAMPLE_FOLDERS = [
  {
    id: "action",
    title: "Action & Adventure",
    subtitle: "High octane blockbusters and thrilling expeditions",
    bg: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80",
    color: "#e50914",
    tag: "324 Titles",
  },
  {
    id: "scifi",
    title: "Sci-Fi & Cyberpunk",
    subtitle: "Dystopian futures, artificial minds, and cosmic wonders",
    bg: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    color: "#00d2ff",
    tag: "189 Titles",
  },
  {
    id: "trending",
    title: "Trending Tonight",
    subtitle: "What the global streaming community is binging right now",
    bg: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    color: "#ff007f",
    tag: "Hot 100",
  },
  {
    id: "netflix",
    title: "Netflix Spotlight",
    subtitle: "Award-winning original movies and captivating limited series",
    bg: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1200&q=80",
    color: "#e50914",
    tag: "Netflix Originals",
  },
  {
    id: "anime",
    title: "Anime Masterpieces",
    subtitle: "Legendary shonen arcs, Studio Ghibli magic, and modern hits",
    bg: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80",
    color: "#f97316",
    tag: "Kitsu Synced",
  },
]

const ACCENT_SWATCHES = [
  "#e50914", // Netflix Red
  "#00d2ff", // Neon Cyan
  "#ff007f", // Neon Pink
  "#a855f7", // Violet
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#3b82f6", // Royal Blue
  "#ffffff", // Clean White
]

export function CoverStudioPage() {
  const [activeLook, setActiveLook] = React.useState<CoverLook>(COVER_LOOKS[0])
  const [selectedFolder, setSelectedFolder] = React.useState(SAMPLE_FOLDERS[0])
  const [orientation, setOrientation] = React.useState<"landscape" | "poster" | "square">("landscape")

  // Style parameters
  const [font, setFont] = React.useState(activeLook.defaultFont)
  const [accentColor, setAccentColor] = React.useState(activeLook.defaultAccent)
  const [vignette, setVignette] = React.useState(activeLook.vignette)
  const [grain, setGrain] = React.useState(activeLook.grain)
  const [scrim, setScrim] = React.useState(activeLook.scrim)
  const [frameWidth, setFrameWidth] = React.useState(activeLook.frameWidth)
  const [frameRadius, setFrameRadius] = React.useState(activeLook.frameRadius)
  const [uppercaseTitle, setUppercaseTitle] = React.useState(true)
  const [showSubtitle, setShowSubtitle] = React.useState(true)
  const [showTagPill, setShowTagPill] = React.useState(true)
  const [customTitle, setCustomTitle] = React.useState("")
  const [isPublishing, setIsPublishing] = React.useState(false)

  // Switch look
  const handleSelectLook = (look: CoverLook) => {
    setActiveLook(look)
    setFont(look.defaultFont)
    setAccentColor(look.defaultAccent)
    setVignette(look.vignette)
    setGrain(look.grain)
    setScrim(look.scrim)
    setFrameWidth(look.frameWidth)
    setFrameRadius(look.frameRadius)
    toast.info(`Applied "${look.name}" look style`)
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const res = await fetch("/api/cover-studio/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${activeLook.name} (${orientation.toUpperCase()})`,
          orientation: orientation.toUpperCase(),
          lookId: activeLook.id,
          colorMode: activeLook.colorMode,
          style: {
            font,
            accentColor,
            vignette,
            grain,
            scrim,
            frameWidth,
            frameRadius,
            uppercaseTitle,
          },
        }),
      })

      if (!res.ok) throw new Error("Failed to save cover set")
      toast.success("Cover style published successfully to your Nuviodeck collection!")
    } catch (err: any) {
      toast.error(err.message || "Failed to publish")
    } finally {
      setIsPublishing(false)
    }
  }

  const currentTitle = customTitle.trim() || selectedFolder.title
  const displayTitle = uppercaseTitle ? currentTitle.toUpperCase() : currentTitle

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-screen bg-background flex flex-col">
        <SiteHeader />

        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Header Title & Intro */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Palette className="size-5" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Cover Studio</h1>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-mono text-[10px]">
                  100% UNLOCKED
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Design cinematic, responsive artwork for collection folders and shelves with procedural graphic layers.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCustomTitle("")
                  handleSelectLook(COVER_LOOKS[0])
                }}
                className="gap-1.5"
              >
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={isPublishing}
                className="gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
              >
                {isPublishing ? <RefreshCw className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                Publish to Profile
              </Button>
            </div>
          </div>

          {/* Look Preset Cards Carousel / Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                1. Select Signature Look
              </h2>
              <span className="text-xs text-muted-foreground font-mono">
                {COVER_LOOKS.length} procedural styles available
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              {COVER_LOOKS.map((look) => {
                const isSelected = activeLook.id === look.id
                return (
                  <button
                    key={look.id}
                    onClick={() => handleSelectLook(look)}
                    className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40"
                        : "border-border/60 bg-card hover:bg-accent/40 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className={`p-1.5 rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {look.icon}
                      </div>
                      {isSelected && (
                        <div className="size-4 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px]">
                          <Check className="size-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="font-semibold text-xs text-foreground line-clamp-1">
                      {look.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                      {look.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main Studio Workspace: Live Preview (Left) + Customizer Panel (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT: Live Preview Canvas */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    2. Live Canvas Preview
                  </span>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {orientation.toUpperCase()}
                  </Badge>
                </div>

                {/* Aspect Ratio Switcher */}
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/40">
                  <button
                    onClick={() => setOrientation("landscape")}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      orientation === "landscape" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    16:9 Landscape
                  </button>
                  <button
                    onClick={() => setOrientation("poster")}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      orientation === "poster" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    2:3 Poster
                  </button>
                  <button
                    onClick={() => setOrientation("square")}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      orientation === "square" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    1:1 Square
                  </button>
                </div>
              </div>

              {/* The Procedural Cover Container */}
              <div className="flex justify-center p-6 sm:p-8 rounded-2xl bg-black/40 border border-border/60 backdrop-blur-md">
                <div
                  className={`relative overflow-hidden shadow-2xl transition-all duration-300 ${
                    orientation === "landscape"
                      ? "w-full max-w-[560px] aspect-video"
                      : orientation === "poster"
                      ? "w-[300px] aspect-[2/3]"
                      : "w-[360px] aspect-square"
                  }`}
                  style={{
                    borderRadius: `${frameRadius}px`,
                    border: frameWidth > 0 ? `${frameWidth}px solid ${accentColor}` : "none",
                  }}
                >
                  {/* Layer 1: Base Plate Image */}
                  <img
                    src={selectedFolder.bg}
                    alt={selectedFolder.title}
                    className="absolute inset-0 size-full object-cover object-center"
                  />

                  {/* Layer 2: Color Wash / Tint */}
                  <div
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{
                      backgroundColor: accentColor,
                      opacity: activeLook.colorMode === "folder" ? 0.35 : activeLook.colorMode === "accent" ? 0.45 : 0.1,
                      mixBlendMode: "multiply",
                    }}
                  />

                  {/* Layer 3: Scrim Gradient (Bottom Darkness for Text Readability) */}
                  <div
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(to top, rgba(0,0,0,${Math.min(1, scrim * 1.5)}) 0%, rgba(0,0,0,${scrim * 0.7}) 45%, transparent 100%)`,
                    }}
                  />

                  {/* Layer 4: Vignette Overlay (Dark Edges) */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                    style={{
                      background: `radial-gradient(circle, transparent 40%, rgba(0,0,0,${vignette}) 100%)`,
                    }}
                  />

                  {/* Layer 5: Film Grain Noise Overlay */}
                  {grain > 0 && (
                    <div
                      className="absolute inset-0 pointer-events-none mix-blend-overlay"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='${grain}'/%3E%3C/svg%3E")`,
                      }}
                    />
                  )}

                  {/* Layer 6: Content Typography & Logos */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                    {/* Tag pill */}
                    {showTagPill && (
                      <div className="mb-2">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase backdrop-blur-md"
                          style={{
                            backgroundColor: `${accentColor}33`,
                            color: accentColor === "#ffffff" ? "#fff" : accentColor,
                            border: `1px solid ${accentColor}66`,
                          }}
                        >
                          <Sparkles className="size-2.5" />
                          {selectedFolder.tag}
                        </span>
                      </div>
                    )}

                    {/* Main Title with Selected Google Font */}
                    <h3
                      className="font-bold leading-none tracking-tight drop-shadow-md transition-all"
                      style={{
                        fontFamily: font,
                        fontSize: orientation === "poster" ? "1.75rem" : "2.25rem",
                      }}
                    >
                      {displayTitle}
                    </h3>

                    {/* Subtitle / Description */}
                    {showSubtitle && (
                      <p className="text-xs text-white/80 line-clamp-1 mt-1 font-normal drop-shadow-sm max-w-[90%]">
                        {selectedFolder.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sample Folders Strip */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Test against sample folder:
                </span>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_FOLDERS.map((folder) => {
                    const isCurrent = selectedFolder.id === folder.id
                    return (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedFolder(folder)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          isCurrent
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-muted/50 border-border/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {folder.title}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: Visual Controls & Procedural Sliders */}
            <div className="lg:col-span-5 space-y-6 bg-card border border-border/60 p-6 rounded-2xl">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                3. Graphic Controls & Layers
              </h2>

              {/* Editable Title Field */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground flex items-center justify-between">
                  <span>Custom Title Text</span>
                  <span className="text-[10px] text-muted-foreground">Overrides folder name</span>
                </label>
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={selectedFolder.title}
                  className="font-medium"
                />
              </div>

              {/* Typography Font Picker */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Type className="size-3.5 text-primary" />
                  <span>Typography (Google Fonts)</span>
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {GOOGLE_FONTS.map((f) => (
                    <button
                      key={f.name}
                      onClick={() => setFont(f.name)}
                      className={`px-3 py-2 rounded-lg border text-left text-xs font-semibold transition-all ${
                        font === f.name
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground"
                      }`}
                      style={{ fontFamily: f.family }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color Palette */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground flex items-center justify-between">
                  <span>Accent Tone & Tint</span>
                  <span className="font-mono text-xs text-muted-foreground uppercase">{accentColor}</span>
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {ACCENT_SWATCHES.map((hex) => (
                    <button
                      key={hex}
                      onClick={() => setAccentColor(hex)}
                      className={`size-7 rounded-full border-2 transition-transform ${
                        accentColor === hex ? "scale-110 border-primary ring-2 ring-primary/30" : "border-border/60 hover:scale-105"
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                  <Input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="size-7 p-0 border-0 rounded-full cursor-pointer"
                  />
                </div>
              </div>

              {/* Procedural Graphic Sliders */}
              <div className="space-y-4 pt-2 border-t border-border/40">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">Vignette Edge Depth</span>
                    <span className="font-mono text-muted-foreground">{Math.round(vignette * 100)}%</span>
                  </div>
                  <Slider
                    value={[vignette * 100]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(v) => setVignette((v[0] || 0) / 100)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">Film Grain Noise</span>
                    <span className="font-mono text-muted-foreground">{Math.round(grain * 100)}%</span>
                  </div>
                  <Slider
                    value={[grain * 100]}
                    min={0}
                    max={40}
                    step={2}
                    onValueChange={(v) => setGrain((v[0] || 0) / 100)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">Text Scrim Shadow</span>
                    <span className="font-mono text-muted-foreground">{Math.round(scrim * 100)}%</span>
                  </div>
                  <Slider
                    value={[scrim * 100]}
                    min={20}
                    max={100}
                    step={5}
                    onValueChange={(v) => setScrim((v[0] || 0) / 100)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">Frame Stroke Width</span>
                    <span className="font-mono text-muted-foreground">{frameWidth}px</span>
                  </div>
                  <Slider
                    value={[frameWidth]}
                    min={0}
                    max={8}
                    step={1}
                    onValueChange={(v) => setFrameWidth(v[0] || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">Corner Rounding</span>
                    <span className="font-mono text-muted-foreground">{frameRadius}px</span>
                  </div>
                  <Slider
                    value={[frameRadius]}
                    min={0}
                    max={32}
                    step={2}
                    onValueChange={(v) => setFrameRadius(v[0] || 0)}
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Uppercase Typography</span>
                  <Switch checked={uppercaseTitle} onCheckedChange={setUppercaseTitle} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Show Folder Subtitle</span>
                  <Switch checked={showSubtitle} onCheckedChange={setShowSubtitle} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Show Category Tag Badge</span>
                  <Switch checked={showTagPill} onCheckedChange={setShowTagPill} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
