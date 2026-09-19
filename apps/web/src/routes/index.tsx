import { createFileRoute, Link } from '@tanstack/react-router'
import { Hero11 } from '@/components/hero-11'
import { Card, CardHeader, CardTitle, CardDescription } from '@workspace/ui/components/card'
import { buttonVariants } from '@workspace/ui/components/button'
import { Film, Zap, Layers, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="w-full min-h-screen bg-stone-50 dark:bg-[#0c0f12]">
      {/* Hero 11 Block */}
      <Hero11
        brandName="Nuviodeck"
        title={"Curate Your Cinema,\nManifest Every Stream."}
        description="A personalized media catalog engine and Debrid manifest manager. Generate signed manifest links, filter 4K HDR streams, and bring curated cinema collections directly to your favorite player."
        primaryText="Open Dashboard"
        primaryHref="/dashboard"
        ctaText="Launch App"
        ctaHref="/dashboard"
      />

      {/* Catalog & Features Showcase Section */}
      <div className="max-w-6xl mx-auto px-6 py-20 space-y-16" id="features">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-800 dark:text-amber-400">
            Cinema Architecture
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-normal tracking-tight text-foreground">
            Bespoke Catalogs & Debrid Integration
          </h2>
          <p className="text-sm text-muted-foreground">
            Connect your streaming accounts and configure high-bitrate media manifests in seconds.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs p-2">
            <CardHeader>
              <div className="size-10 rounded-xl bg-teal-950/10 dark:bg-amber-400/10 flex items-center justify-center text-teal-950 dark:text-amber-400 mb-2">
                <Film className="size-5" />
              </div>
              <CardTitle className="text-lg font-serif">1,000+ Curated Catalogs</CardTitle>
              <CardDescription>
                Discover collections across 29+ categories, from Criterion classics and director retrospectives to trending 4K HDR releases.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs p-2">
            <CardHeader>
              <div className="size-10 rounded-xl bg-teal-950/10 dark:bg-amber-400/10 flex items-center justify-center text-teal-950 dark:text-amber-400 mb-2">
                <Zap className="size-5" />
              </div>
              <CardTitle className="text-lg font-serif">Bring Your Own Debrid</CardTitle>
              <CardDescription>
                Seamlessly connect Real-Debrid, AllDebrid, TorBox, or Premiumize with smart resolution filtering and audio track selection.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="rounded-2xl border bg-card/60 backdrop-blur-xs shadow-xs p-2">
            <CardHeader>
              <div className="size-10 rounded-xl bg-teal-950/10 dark:bg-amber-400/10 flex items-center justify-center text-teal-950 dark:text-amber-400 mb-2">
                <Layers className="size-5" />
              </div>
              <CardTitle className="text-lg font-serif">Signed Manifest URLs</CardTitle>
              <CardDescription>
                One dynamic link compatible with Stremio, Kodi, and web players. Rotate tokens or manage family profiles with a click.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Call to action card */}
        <div className="rounded-3xl border bg-card/80 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-serif font-normal">Ready to experience your collection?</h3>
            <p className="text-muted-foreground text-sm max-w-lg">
              Explore your personalized workspace, manage stream manifests, and curate catalogs.
            </p>
          </div>
          <Link
            to="/dashboard"
            className={buttonVariants({
              size: 'lg',
              className: 'rounded-full px-8 h-12 text-base font-semibold shadow-xs shrink-0',
            })}
          >
            Launch Dashboard
            <ArrowRight className="size-4 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  )
}
