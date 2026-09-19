import * as React from "react"
import { motion } from "framer-motion"
import {
  Tv,
  Sparkles,
  Award,
  Layers,
  Play,
  Subtitles,
  Palette,
  Link2,
  Users,
  Copy,
  Check,
  RotateCw,
  Star,
  Film,
  Flame,
} from "lucide-react"

const posters = [
  {
    title: "Interstellar",
    rating: "8.7",
    year: "2014",
    genre: "Sci-Fi • Adventure",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop",
  },
  {
    title: "Dune: Part Two",
    image:
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=300&auto=format&fit=crop",
  },
  {
    title: "Blade Runner 2049",
    image:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=300&auto=format&fit=crop",
  },
  {
    title: "Oppenheimer",
    image:
      "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=300&auto=format&fit=crop",
  },
  {
    title: "Inception",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=300&auto=format&fit=crop",
  },
  {
    title: "Mad Max: Fury Road",
    image:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=300&auto=format&fit=crop",
  },
  {
    title: "Parasite",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=300&auto=format&fit=crop",
  },
  {
    title: "Spider-Man",
    image:
      "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=300&auto=format&fit=crop",
  },
]

const badges = [
  "4K",
  "HDR10+",
  "Dolby Vision",
  "HD",
  "Dolby Atmos",
  "DTS:X",
  "Dolby TrueHD",
  "IMAX Enhanced",
]

export function StreamingBento() {
  const [copied, setCopied] = React.useState(false)
  const [activeProfile, setActiveProfile] = React.useState("Movie Night")

  const handleCopy = () => {
    navigator.clipboard?.writeText?.("https://nuviodeck.com/manifest/stremio/usr_8f932e91")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-20" id="features">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
        <h2 className="text-3xl md:text-5xl font-serif font-normal tracking-tight text-foreground">
          Craft the perfect streaming home
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          From a 1,000-row library to AI rows, streams, subtitles, custom artwork, and
          a live preview, all without touching code.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Live Preview on TV & Mobile (Col-span 2) */}
        <div className="md:col-span-2 rounded-3xl border bg-card/60 dark:bg-card/40 backdrop-blur-md p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-xs relative group transition-all hover:border-teal-950/30 dark:hover:border-teal-400/20">
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2.5 text-teal-800 dark:text-amber-400">
              <div className="size-8 rounded-lg bg-teal-950/10 dark:bg-amber-400/10 flex items-center justify-center">
                <Tv className="size-4" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Live preview on TV & mobile
              </h3>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              See exactly how your home renders in Nuvio before you ship it.
            </p>
          </div>

          {/* TV Interface Mockup */}
          <div className="rounded-2xl border border-white/10 bg-black/80 dark:bg-black/90 p-4 sm:p-5 text-white overflow-hidden shadow-2xl relative">
            {/* Nav Bar in Preview */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
              <div className="flex items-center gap-4 text-white/70">
                <div className="size-5 rounded-full bg-teal-500 flex items-center justify-center text-black">
                  <Play className="size-2.5 fill-current" />
                </div>
                <span className="text-white font-medium">Home</span>
                <span className="hover:text-white transition-colors cursor-pointer">Discover</span>
                <span className="hover:text-white transition-colors cursor-pointer">Library</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-300 text-[10px] font-semibold tracking-wider uppercase border border-teal-400/30">
                Preview
              </span>
            </div>

            {/* Banner Content */}
            <div className="pt-4 pb-3 space-y-2">
              <h4 className="text-2xl font-bold tracking-tight text-white">Interstellar</h4>
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                  <Star className="size-3 fill-current" /> 8.7
                </span>
                <span>•</span>
                <span>2014</span>
                <span>•</span>
                <span>Sci-Fi • Adventure</span>
              </div>
              <p className="text-xs text-white/70 line-clamp-2 max-w-md">
                Mankind was born on Earth. It was never meant to die here.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  className="px-3 py-1 rounded-md bg-white text-black font-semibold text-xs inline-flex items-center gap-1 hover:bg-white/90"
                >
                  <Play className="size-3 fill-current" /> Play
                </button>
                <button
                  type="button"
                  className="px-3 py-1 rounded-md bg-white/20 text-white font-medium text-xs hover:bg-white/30"
                >
                  Trailer
                </button>
              </div>
            </div>

            {/* Trending Shelf */}
            <div className="pt-2">
              <div className="flex items-center gap-1 text-xs font-semibold text-white/80 mb-2">
                <Flame className="size-3 text-amber-400" />
                <span>Trending This Week &gt;</span>
              </div>
              <div className="flex gap-2 overflow-x-hidden">
                {posters.slice(0, 6).map((poster) => (
                  <div
                    key={poster.title}
                    className="size-16 sm:size-20 shrink-0 rounded-lg overflow-hidden border border-white/10 relative group/item"
                  >
                    <img
                      src={poster.image}
                      alt={poster.title}
                      className="size-full object-cover transition-transform duration-300 group-hover/item:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                      <span className="text-[9px] text-white/90 truncate font-medium">
                        {poster.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column Stack */}
        <div className="flex flex-col gap-5">
          {/* Card 2: AI Recommendations */}
          <div className="rounded-3xl border bg-card/60 dark:bg-card/40 backdrop-blur-md p-6 flex flex-col justify-between shadow-xs transition-all hover:border-teal-950/30 dark:hover:border-teal-400/20">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-teal-800 dark:text-amber-400">
                <div className="size-8 rounded-lg bg-teal-950/10 dark:bg-amber-400/10 flex items-center justify-center">
                  <Sparkles className="size-4" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  AI recommendations
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Gemini, Groq, or DeepSeek build personalized rows from your Trakt, Simkl,
                MyAnimeList, and AniList history—a home that knows your taste.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Trakt Sync
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Simkl
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                AniList
              </span>
            </div>
          </div>

          {/* Card 3: Badge Studio */}
          <div className="rounded-3xl border bg-card/60 dark:bg-card/40 backdrop-blur-md p-6 flex flex-col justify-between shadow-xs transition-all hover:border-teal-950/30 dark:hover:border-teal-400/20">
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2.5 text-teal-800 dark:text-amber-400">
                <div className="size-8 rounded-lg bg-teal-950/10 dark:bg-amber-400/10 flex items-center justify-center">
                  <Award className="size-4" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  Badge Studio
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Curated stream-quality badge sets you can recolor, reorder, and publish.
              </p>
            </div>
            {/* Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {badges.map((badge) => (
                <div
                  key={badge}
                  className="rounded-lg border border-border/80 bg-muted/40 px-2 py-1.5 text-center text-xs font-semibold text-foreground tracking-wider hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-default"
                >
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 4: 1,000+ Catalogs (Col-span 3 / Full width) */}
        <div className="md:col-span-3 rounded-3xl border bg-card/60 dark:bg-card/40 backdrop-blur-md p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xs overflow-hidden transition-all hover:border-teal-950/30 dark:hover:border-teal-400/20">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2.5 text-teal-800 dark:text-amber-400">
              <div className="size-8 rounded-lg bg-teal-950/10 dark:bg-amber-400/10 flex items-center justify-center">
                <Layers className="size-4" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                1,000+ catalogs, 29 categories
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Trending, Streaming, Genres, Anime, World Cinema, Studios, Networks, Awards,
              Actors, Directors, Decades, Kids & Family, and more—ready to drop in.
            </p>
          </div>

          {/* Posters Grid Display */}
          <div className="grid grid-cols-4 gap-2.5 shrink-0">
            {posters.map((poster) => (
              <div
                key={poster.title}
                className="w-16 h-22 sm:w-20 sm:h-28 rounded-lg overflow-hidden border border-border shadow-sm hover:scale-105 transition-transform duration-200"
              >
                <img
                  src={poster.image}
                  alt={poster.title}
                  className="size-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Row 3: 3 Columns */}
        {/* Card 5: Streams from your own accounts */}
        <div className="rounded-3xl border bg-card/60 dark:bg-card/40 backdrop-blur-md p-6 flex flex-col justify-between shadow-xs transition-all hover:border-teal-950/30 dark:hover:border-teal-400/20">
          <div className="space-y-3">
            <div className="size-9 rounded-xl bg-teal-950/10 dark:bg-amber-400/10 flex items-center justify-center text-teal-800 dark:text-amber-400">
              <Play className="size-4.5" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Streams from your own accounts
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bring your Real-Debrid, AllDebrid, TorBox, or Premiumize account and Nuviodeck
              serves the streams, filtered, sorted, and formatted the way you want.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t text-xs font-semibold text-teal-800 dark:text-amber-400 uppercase tracking-wider">
            Debrid Native
          </div>
        </div>

        {/* Card 6: Subtitles, merged */}
        <div className="rounded-3xl border bg-card/60 dark:bg-card/40 backdrop-blur-md p-6 flex flex-col justify-between shadow-xs transition-all hover:border-teal-950/30 dark:hover:border-teal-400/20">
          <div className="space-y-3">
            <div className="size-9 rounded-xl bg-teal-950/10 dark:bg-amber-400/10 flex items-center justify-center text-teal-800 dark:text-amber-400">
              <Subtitles className="size-4.5" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Subtitles, merged
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              One list gathered from every source, labelled with the release each was timed to.
              OpenSubtitles and SubSource built-in automatically.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t text-xs font-semibold text-teal-800 dark:text-amber-400 uppercase tracking-wider">
            Multi-Language Sync
          </div>
        </div>

        {/* Card 7: Custom cover art */}
        <div className="rounded-3xl border bg-card/60 dark:bg-card/40 backdrop-blur-md p-6 flex flex-col justify-between shadow-xs transition-all hover:border-teal-950/30 dark:hover:border-teal-400/20 overflow-hidden">
          <div className="space-y-3">
            <div className="size-9 rounded-xl bg-teal-950/10 dark:bg-amber-400/10 flex items-center justify-center text-teal-800 dark:text-amber-400">
              <Palette className="size-4.5" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              Custom cover art
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              60+ curated cover sets to pick from for each folder, with motion artwork and hover
              effects.
            </p>
          </div>

          {/* Decorative Cover Art Fan */}
          <div className="flex items-center justify-center gap-2 mt-4 pt-4">
            <div className="w-12 h-16 rounded-md bg-linear-to-tr from-teal-900 to-emerald-500 border border-white/20 shadow-md rotate-[-8deg]" />
            <div className="w-12 h-16 rounded-md bg-linear-to-tr from-amber-700 to-orange-400 border border-white/20 shadow-md" />
            <div className="w-12 h-16 rounded-md bg-linear-to-tr from-indigo-900 to-purple-500 border border-white/20 shadow-md rotate-8" />
          </div>
        </div>

        {/* Row 4: 2 Columns */}
        {/* Card 8: One link, in sync */}
        <div className="md:col-span-1 rounded-3xl border bg-card/60 dark:bg-card/40 backdrop-blur-md p-6 sm:p-8 flex flex-col justify-between shadow-xs transition-all hover:border-teal-950/30 dark:hover:border-teal-400/20">
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2.5 text-teal-800 dark:text-amber-400">
              <div className="size-8 rounded-lg bg-teal-950/10 dark:bg-amber-400/10 flex items-center justify-center">
                <Link2 className="size-4" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                One link, in sync
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A signed manifest URL that stays valid across Stremio, Kodi, and web players. Rotate
              or revoke any time.
            </p>
          </div>

          {/* Link Box */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl border bg-muted/50 font-mono text-xs text-muted-foreground">
              <span className="truncate">nuviodeck.com/manifest/stremio/...</span>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 p-1.5 rounded-lg hover:bg-background transition-colors text-foreground"
                title="Copy manifest link"
              >
                {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Synced
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <RotateCw className="size-3" />
                <span>Rotate</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 9: Multiple profiles (Col-span 2) */}
        <div className="md:col-span-2 rounded-3xl border bg-card/60 dark:bg-card/40 backdrop-blur-md p-6 sm:p-8 flex flex-col justify-between shadow-xs transition-all hover:border-teal-950/30 dark:hover:border-teal-400/20">
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2.5 text-teal-800 dark:text-amber-400">
              <div className="size-8 rounded-lg bg-teal-950/10 dark:bg-amber-400/10 flex items-center justify-center">
                <Users className="size-4" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                Multiple profiles
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              One link each for Movies, TV, and Kids. Switch any time or isolate family configs.
            </p>
          </div>

          {/* Profile Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                title: "Movie Night",
                rows: "12 rows",
                collections: "6 collections",
                updated: "2h ago",
                active: true,
              },
              {
                title: "Binge Watch",
                rows: "9 rows",
                collections: "5 collections",
                updated: "5h ago",
                active: false,
              },
              {
                title: "Kids",
                rows: "8 rows",
                collections: "4 collections",
                updated: "1d ago",
                active: false,
              },
            ].map((profile) => (
              <div
                key={profile.title}
                onClick={() => setActiveProfile(profile.title)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  activeProfile === profile.title
                    ? "border-primary/50 bg-primary/5 dark:bg-primary/10 shadow-xs"
                    : "border-border bg-card/40 hover:border-border/80"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-foreground">{profile.title}</span>
                  {activeProfile === profile.title ? (
                    <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                      Active
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>
                    {profile.rows} • {profile.collections}
                  </div>
                  <div className="text-[10px] opacity-70">Updated {profile.updated}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
