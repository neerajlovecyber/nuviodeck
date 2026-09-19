import { createFileRoute, Link } from '@tanstack/react-router'
import { Hero11 } from '@/components/hero-11'
import { StreamingBento } from '@/components/streaming-bento'
import { Footer15 } from '@/components/footer-15'
import { buttonVariants } from '@workspace/ui/components/button'
import { ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="w-full min-h-screen bg-stone-50 dark:bg-[#0c0f12]">
      {/* Hero 11 Block */}
      <Hero11
        brandName="Nuviodeck"
        title={"Build your streaming deck,\nvisually."}
        description="1,000+ curated catalogs, instant Debrid integration, and 4K stream filtering, assembled in a visual wizard. No raw JSON. One signed link, straight into your player."
        primaryText="Open Dashboard"
        primaryHref="/dashboard"
        ctaText="Launch App"
        ctaHref="/dashboard"
      />

      {/* Streaming Bento Showcase */}
      <StreamingBento />

      {/* Call to action card */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
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

      {/* Footer 15 */}
      <Footer15 />
    </div>
  )
}
