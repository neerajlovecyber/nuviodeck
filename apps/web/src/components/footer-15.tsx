import * as React from "react"
import { Link } from "@tanstack/react-router"
import { ArrowRight } from "lucide-react"

export interface FooterLink {
  label: string
  href: string
  isExternal?: boolean
}

export interface FooterColumn {
  title: string
  links: FooterLink[]
}

const defaultColumns: FooterColumn[] = [
  {
    title: "Catalogs",
    links: [
      { label: "4K HDR Releases", href: "#features" },
      { label: "Criterion Collection", href: "#features" },
      { label: "Director Retrospectives", href: "#features" },
      { label: "Anime & World Cinema", href: "#features" },
      { label: "Trending This Week", href: "#features" },
    ],
  },
  {
    title: "Integrations",
    links: [
      { label: "Real-Debrid", href: "#features" },
      { label: "AllDebrid", href: "#features" },
      { label: "TorBox", href: "#features" },
      { label: "Premiumize", href: "#features" },
      { label: "Stremio Manifest", href: "#features" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Manifest Studio", href: "/dashboard" },
      { label: "Badge Creator", href: "/dashboard" },
      { label: "Profiles & Filters", href: "/dashboard" },
      { label: "Documentation", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Third-Party Notice", href: "#" },
      { label: "Disclaimer", href: "#" },
    ],
  },
]

export function Footer15() {
  return (
    <footer className="relative w-full overflow-hidden border-t bg-card/60 dark:bg-[#080b0d] pt-16 pb-0 sm:pt-20 text-foreground transition-colors">
      <div className="max-w-6xl mx-auto px-6">
        {/* Top Grid: Brand Description & Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 pb-16">
          {/* Brand Info (Left - 4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-xs">
                N
              </div>
              <span className="text-xl font-bold tracking-tight">Nuviodeck</span>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              A personalized cinema catalog engine and Debrid manifest manager. Curate 1,000+
              collections, filter 4K streams, and export signed links directly to your favorite player.
            </p>

            <div>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm"
              >
                <span>Launch Dashboard</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Nav Columns (Right - 8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {defaultColumns.map((col) => (
              <div key={col.title} className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/90">
                  {col.title}
                </h4>
                <ul className="space-y-2.5 text-sm">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("/") ? (
                        <Link
                          to={link.href}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Bar: Status & Socials */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>All Manifest & Debrid Engines Operational</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors p-1"
              aria-label="GitHub"
            >
              <svg className="size-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors p-1"
              aria-label="X (Twitter)"
            >
              <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors p-1"
              aria-label="Discord"
            >
              <svg className="size-4 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
            <span className="text-muted-foreground/60">•</span>
            <span>© {new Date().getFullYear()} Nuviodeck</span>
          </div>
        </div>
      </div>

      {/* Signature Oversized Outlined Wordmark Bleeding off the bottom edge */}
      <div className="relative w-full overflow-hidden select-none pointer-events-none pt-4">
        <div className="text-[clamp(4.25rem,14vw,13.5rem)] font-extrabold uppercase tracking-tight text-transparent text-center leading-[0.8] whitespace-nowrap [-webkit-text-stroke:1px_rgba(15,23,42,0.12)] dark:[-webkit-text-stroke:1px_rgba(255,255,255,0.07)]">
          NUVIODECK
        </div>
      </div>
    </footer>
  )
}
