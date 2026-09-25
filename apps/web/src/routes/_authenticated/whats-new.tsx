import * as React from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import changelogData from "@/data/changelog.json"
import {
  Sparkles,
  Search,
  CheckCircle2,
  Wrench,
  Zap,
  ArrowRight,
  Calendar,
  Filter,
} from "lucide-react"

export const Route = createFileRoute("/_authenticated/whats-new")({
  component: WhatsNewPage,
})

interface ChangelogEntry {
  id: string
  date: string
  tag: "added" | "fixed" | "improved" | "changed"
  title: string
  body: string
  supporter?: boolean
  link?: {
    to: string
    label: string
  }
}

export function WhatsNewPage() {
  const [search, setSearch] = React.useState("")
  const [activeTag, setActiveTag] = React.useState<string>("all")

  const entries = changelogData as ChangelogEntry[]

  // Filter entries
  const filtered = entries.filter((entry) => {
    if (activeTag !== "all" && entry.tag !== activeTag) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      entry.title.toLowerCase().includes(q) ||
      entry.body.toLowerCase().includes(q) ||
      entry.date.includes(q)
    )
  })

  // Group by Month (YYYY-MM)
  const grouped = React.useMemo(() => {
    const map = new Map<string, ChangelogEntry[]>()
    for (const item of filtered) {
      const month = item.date.slice(0, 7) // "2026-09"
      const list = map.get(month) || []
      list.push(item)
      map.set(month, list)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  const formatMonthTitle = (monthStr: string) => {
    const [year, month] = monthStr.split("-")
    const date = new Date(Number(year), Number(month) - 1, 1)
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }

  const getTagBadge = (tag: string) => {
    switch (tag) {
      case "added":
        return (
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] font-mono uppercase">
            New
          </Badge>
        )
      case "fixed":
        return (
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-[10px] font-mono uppercase">
            Fixed
          </Badge>
        )
      case "improved":
        return (
          <Badge variant="outline" className="border-sky-500/30 text-sky-400 bg-sky-500/10 text-[10px] font-mono uppercase">
            Improved
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10 text-[10px] font-mono uppercase">
            Updated
          </Badge>
        )
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-screen bg-background flex flex-col">
        <SiteHeader />

        <div className="flex-1 p-6 md:p-8 max-w-5xl w-full mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Sparkles className="size-5" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">What's New</h1>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {entries.length} Updates
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Release notes, new streaming features, performance improvements, and fixes in Nuviodeck.
              </p>
            </div>
          </div>

          {/* Search & Tag Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search changelog..."
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {["all", "added", "improved", "fixed", "changed"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    activeTag === tag
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/50 border border-border/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline of Updates grouped by month */}
          <div className="space-y-10">
            {grouped.map(([month, monthEntries]) => (
              <div key={month} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                  <Calendar className="size-4 text-primary" />
                  <h2 className="text-base font-bold text-foreground">
                    {formatMonthTitle(month)}
                  </h2>
                  <span className="text-xs text-muted-foreground font-mono">
                    ({monthEntries.length} updates)
                  </span>
                </div>

                <div className="space-y-3 pl-2 border-l border-border/40">
                  {monthEntries.map((item) => (
                    <div
                      key={item.id}
                      className="relative pl-6 before:absolute before:left-[-5px] before:top-2 before:size-2 before:rounded-full before:bg-primary/80"
                    >
                      <div className="p-4 rounded-xl border border-border/60 bg-card space-y-2 hover:border-border transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getTagBadge(item.tag)}
                            <h3 className="text-sm font-bold text-foreground">
                              {item.title}
                            </h3>
                          </div>
                          <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                            {item.date}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {item.body}
                        </p>

                        {item.link && (
                          <div className="pt-1">
                            <Link
                              to={item.link.to as any}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                            >
                              <span>{item.link.label}</span>
                              <ArrowRight className="size-3" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {grouped.length === 0 && (
              <div className="text-center py-12 space-y-2">
                <p className="text-sm text-muted-foreground">No changelog entries matched your search.</p>
                <Button variant="outline" size="sm" onClick={() => { setSearch(""); setActiveTag("all"); }}>
                  Reset Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
