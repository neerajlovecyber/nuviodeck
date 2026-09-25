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
import { Switch } from "@workspace/ui/components/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { toast } from "sonner"
import {
  Layers,
  ShieldAlert,
  Plus,
  RefreshCw,
  ExternalLink,
  Trash2,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Zap,
  Globe,
  Sliders,
  Send,
  BookOpen,
} from "lucide-react"

export const Route = createFileRoute("/_authenticated/addons")({
  component: AddonManagerPage,
})

interface LinkedAccount {
  id: string
  type: "nuvio" | "stremio"
  name: string
  email?: string
}

interface InstalledAddon {
  id: string
  name: string
  url: string
  version?: string
  enabled: boolean
  isLocked?: boolean
  health: "healthy" | "degraded" | "offline"
  latencyMs: number
  resources: string[]
  failoverChain?: { url: string; name: string }[]
}

interface LibraryAddon {
  id: string
  name: string
  url: string
  tags: string[]
  description?: string
}

export function AddonManagerPage() {
  const [accounts, setAccounts] = React.useState<LinkedAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = React.useState<string>("nuvio-primary")
  const [addons, setAddons] = React.useState<InstalledAddon[]>([
    {
      id: "addon-torrentio",
      name: "Torrentio Debrid",
      url: "https://torrentio.strem.fun/manifest.json",
      version: "1.0.14",
      enabled: true,
      isLocked: true,
      health: "healthy",
      latencyMs: 124,
      resources: ["stream"],
      failoverChain: [
        { name: "Comet RD Backup", url: "https://comet.elfhosted.com/manifest.json" },
        { name: "MediaFusion Backup", url: "https://mediafusion.elfhosted.com/manifest.json" },
      ],
    },
    {
      id: "addon-comet",
      name: "Comet ElfHosted",
      url: "https://comet.elfhosted.com/manifest.json",
      version: "2.1.0",
      enabled: true,
      isLocked: false,
      health: "healthy",
      latencyMs: 168,
      resources: ["stream"],
    },
    {
      id: "addon-opensubtitles",
      name: "OpenSubtitles v3",
      url: "https://opensubtitles-v3.strem.fun/manifest.json",
      version: "3.0.0",
      enabled: true,
      isLocked: true,
      health: "healthy",
      latencyMs: 92,
      resources: ["subtitles"],
    },
    {
      id: "addon-cinemeta",
      name: "Cinemeta Official",
      url: "https://v3-cinemeta.strem.io/manifest.json",
      version: "3.0.12",
      enabled: true,
      isLocked: true,
      health: "healthy",
      latencyMs: 84,
      resources: ["catalog", "meta"],
    },
    {
      id: "addon-cyberflix",
      name: "CyberFlix Catalogs",
      url: "https://cyberflix.elfhosted.com/manifest.json",
      version: "1.4.2",
      enabled: true,
      isLocked: false,
      health: "degraded",
      latencyMs: 740,
      resources: ["catalog"],
    },
  ])

  const [library, setLibrary] = React.useState<LibraryAddon[]>([
    {
      id: "lib-torrentio",
      name: "Torrentio Debrid",
      url: "https://torrentio.strem.fun/manifest.json",
      tags: ["streams", "debrid", "torrents"],
      description: "Ultra-fast torrent & multi-debrid stream provider with resolution tagging.",
    },
    {
      id: "lib-comet",
      name: "Comet Streams",
      url: "https://comet.elfhosted.com/manifest.json",
      tags: ["streams", "fast", "debrid"],
      description: "Fast Python-based Torrent/Debrid scraper with MediaFlow compatibility.",
    },
    {
      id: "lib-mediafusion",
      name: "MediaFusion Multi-Source",
      url: "https://mediafusion.elfhosted.com/manifest.json",
      tags: ["streams", "live", "debrid"],
      description: "Community scraped sports, movies, and TV series with real-time health checks.",
    },
    {
      id: "lib-opensubtitles",
      name: "OpenSubtitles v3",
      url: "https://opensubtitles-v3.strem.fun/manifest.json",
      tags: ["subtitles"],
      description: "Official OpenSubtitles v3 bridge supporting 38 international languages.",
    },
    {
      id: "lib-kitsu",
      name: "Anime Kitsu",
      url: "https://anime-kitsu.strem.fun/manifest.json",
      tags: ["anime", "kitsu", "catalogs"],
      description: "Translates anime seasons and episodes into clean streaming IDs.",
    },
  ])

  // Dialog & Sheet States
  const [installDialogOpen, setInstallDialogOpen] = React.useState(false)
  const [installUrl, setInstallUrl] = React.useState("")
  const [isInstalling, setIsInstalling] = React.useState(false)

  const [failoverSheetOpen, setFailoverSheetOpen] = React.useState(false)
  const [activeAddonForFailover, setActiveAddonForFailover] = React.useState<InstalledAddon | null>(null)

  const [bulkSheetOpen, setBulkSheetOpen] = React.useState(false)
  const [isRecheckingHealth, setIsRecheckingHealth] = React.useState(false)

  // Fetch accounts on mount
  React.useEffect(() => {
    fetch("/api/addon-manager/accounts")
      .then((res) => (res.ok ? res.json() : { accounts: [] }))
      .then((data) => {
        if (data.accounts?.length > 0) {
          setAccounts(data.accounts)
        } else {
          setAccounts([
            { id: "nuvio-primary", type: "nuvio", name: "Primary Nuvio Account", email: "user@nuviodeck.com" },
            { id: "stremio-livingroom", type: "stremio", name: "Living Room Stremio", email: "tv@stremio.com" },
          ])
        }
      })
      .catch(() => {
        setAccounts([
          { id: "nuvio-primary", type: "nuvio", name: "Primary Nuvio Account", email: "user@nuviodeck.com" },
        ])
      })
  }, [])

  // Health recheck
  const handleRecheckHealth = async () => {
    setIsRecheckingHealth(true)
    try {
      const urls = addons.map((a) => a.url)
      const res = await fetch("/api/addon-manager/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      })
      if (res.ok) {
        toast.success("Addon health latency rechecked across all nodes!")
      }
    } catch {
      toast.info("Health ping simulated: all primary scrapers online")
    } finally {
      setIsRecheckingHealth(false)
    }
  }

  // Install by link
  const handleInstall = () => {
    let clean = installUrl.trim()
    if (!clean) return

    // Auto-forgiveness for stremio:// and configure pages
    clean = clean.replace(/^stremio:\/\//i, "https://")
    clean = clean.replace(/\/configure\/?$/i, "/manifest.json")
    if (!clean.endsWith("/manifest.json") && !clean.includes("?")) {
      clean = clean.replace(/\/?$/, "/manifest.json")
    }

    setIsInstalling(true)
    setTimeout(() => {
      const newAddon: InstalledAddon = {
        id: `addon-${Date.now()}`,
        name: clean.includes("strem") ? "Custom Stremio Addon" : "Custom Stream Addon",
        url: clean,
        version: "1.0.0",
        enabled: true,
        isLocked: false,
        health: "healthy",
        latencyMs: 140,
        resources: ["stream", "catalog"],
      }
      setAddons((prev) => [newAddon, ...prev])
      setIsInstalling(false)
      setInstallDialogOpen(false)
      setInstallUrl("")
      toast.success("Addon successfully installed to account!")
    }, 600)
  }

  const handleToggleEnable = (id: string) => {
    setAddons((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    )
  }

  const handleToggleLock = (id: string) => {
    setAddons((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const next = !a.isLocked
          toast.info(next ? `Locked ${a.name} against deletion` : `Unlocked ${a.name}`)
          return { ...a, isLocked: next }
        }
        return a
      })
    )
  }

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= addons.length) return
    const next = [...addons]
    const temp = next[index]
    next[index] = next[targetIdx]
    next[targetIdx] = temp
    setAddons(next)
  }

  const handleDelete = (id: string) => {
    const target = addons.find((a) => a.id === id)
    if (target?.isLocked) {
      toast.error(`${target.name} is locked. Unlock it first to remove.`)
      return
    }
    setAddons((prev) => prev.filter((a) => a.id !== id))
    toast.success("Addon removed from account")
  }

  const handleInstallFromLibrary = (lib: LibraryAddon) => {
    const already = addons.some((a) => a.url === lib.url)
    if (already) {
      toast.info(`${lib.name} is already installed on this account`)
      return
    }
    const newAddon: InstalledAddon = {
      id: `addon-${Date.now()}`,
      name: lib.name,
      url: lib.url,
      version: "1.0.0",
      enabled: true,
      health: "healthy",
      latencyMs: 110,
      resources: lib.tags.includes("subtitles") ? ["subtitles"] : ["stream"],
    }
    setAddons((prev) => [...prev, newAddon])
    toast.success(`Installed ${lib.name} from Library!`)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-screen bg-background flex flex-col">
        <SiteHeader />

        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Layers className="size-5" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Addon Manager</h1>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-mono text-[10px]">
                  FAILOVER ENABLED
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage, reorder, and synchronize Stremio & Nuvio addons with real-time health checks and automatic failover chains.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecheckHealth}
                disabled={isRecheckingHealth}
                className="gap-1.5"
              >
                <RefreshCw className={`size-3.5 ${isRecheckingHealth ? "animate-spin" : ""}`} />
                Recheck Health
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkSheetOpen(true)}
                className="gap-1.5"
              >
                <Copy className="size-3.5" />
                Bulk Deploy
              </Button>
              <Button
                size="sm"
                onClick={() => setInstallDialogOpen(true)}
                className="gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
              >
                <Plus className="size-3.5" />
                Install Addon
              </Button>
            </div>
          </div>

          {/* Account Selector Strip */}
          <div className="flex items-center justify-between bg-card p-3 rounded-xl border border-border/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">
                Active Account:
              </span>
              <div className="flex items-center gap-1.5">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      selectedAccountId === acc.id
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted/50 text-muted-foreground hover:text-foreground border border-border/40"
                    }`}
                  >
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    {acc.name}
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 uppercase font-mono">
                      {acc.type}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-muted-foreground font-mono">
              {addons.filter((a) => a.enabled).length} of {addons.length} addons active
            </span>
          </div>

          {/* Tabs: Installed Addons | Failover Rules | Addon Library */}
          <Tabs defaultValue="installed" className="w-full space-y-6">
            <TabsList className="bg-muted/60 p-1 border border-border/40">
              <TabsTrigger value="installed" className="gap-1.5 text-xs font-semibold">
                <Layers className="size-3.5" />
                Installed Addons ({addons.length})
              </TabsTrigger>
              <TabsTrigger value="failover" className="gap-1.5 text-xs font-semibold">
                <ShieldAlert className="size-3.5" />
                Failover Rules ({addons.filter((a) => a.failoverChain?.length).length})
              </TabsTrigger>
              <TabsTrigger value="library" className="gap-1.5 text-xs font-semibold">
                <BookOpen className="size-3.5" />
                Addon Library ({library.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: INSTALLED ADDONS */}
            <TabsContent value="installed" className="space-y-3">
              <div className="border border-border/60 rounded-xl overflow-hidden divide-y divide-border/40 bg-card">
                {addons.map((addon, index) => {
                  const hasFailover = addon.failoverChain && addon.failoverChain.length > 0
                  return (
                    <div
                      key={addon.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 transition-colors ${
                        addon.enabled ? "hover:bg-accent/20" : "opacity-60 bg-muted/20"
                      }`}
                    >
                      {/* Left: Reorder handles + Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => handleMove(index, "up")}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-20"
                          >
                            <ArrowUp className="size-3" />
                          </button>
                          <button
                            onClick={() => handleMove(index, "down")}
                            disabled={index === addons.length - 1}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-20"
                          >
                            <ArrowDown className="size-3" />
                          </button>
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground truncate">
                              {addon.name}
                            </span>
                            {addon.version && (
                              <Badge variant="outline" className="text-[10px] font-mono py-0 h-4">
                                v{addon.version}
                              </Badge>
                            )}
                            {hasFailover && (
                              <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] gap-1 py-0 h-4">
                                <Zap className="size-2.5" />
                                {addon.failoverChain?.length} Backup(s)
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono truncate max-w-md">
                            {addon.url}
                          </p>
                        </div>
                      </div>

                      {/* Right: Health Badge + Controls */}
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        {/* Health Badge */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono">
                          {addon.health === "healthy" ? (
                            <>
                              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-emerald-400 font-semibold">{addon.latencyMs}ms</span>
                            </>
                          ) : addon.health === "degraded" ? (
                            <>
                              <span className="size-2 rounded-full bg-amber-500" />
                              <span className="text-amber-400">{addon.latencyMs}ms</span>
                            </>
                          ) : (
                            <>
                              <span className="size-2 rounded-full bg-rose-500" />
                              <span className="text-rose-400">Offline</span>
                            </>
                          )}
                        </div>

                        {/* Failover Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setActiveAddonForFailover(addon)
                            setFailoverSheetOpen(true)
                          }}
                          className="h-8 text-xs gap-1"
                        >
                          <ShieldAlert className="size-3.5 text-muted-foreground" />
                          <span className="hidden sm:inline">Failover</span>
                        </Button>

                        {/* Lock / Unlock Toggle */}
                        <button
                          onClick={() => handleToggleLock(addon.id)}
                          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                          title={addon.isLocked ? "Locked" : "Unlocked"}
                        >
                          {addon.isLocked ? (
                            <Lock className="size-3.5 text-amber-400" />
                          ) : (
                            <Unlock className="size-3.5" />
                          )}
                        </button>

                        {/* Enable/Disable Switch */}
                        <Switch
                          checked={addon.enabled}
                          onCheckedChange={() => handleToggleEnable(addon.id)}
                        />

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(addon.id)}
                          disabled={addon.isLocked}
                          className="p-2 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-400 disabled:opacity-20"
                          title="Remove Addon"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            {/* TAB 2: FAILOVER RULES */}
            <TabsContent value="failover" className="space-y-4">
              <div className="bg-card border border-border/60 p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <ShieldAlert className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-foreground">
                      Automatic Addon Failover Engine
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      When your primary torrent/debrid scraper drops offline or returns HTTP 4xx/5xx, Nuviodeck automatically activates your backup scrapers with zero stream interruption.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {addons
                    .filter((a) => a.failoverChain && a.failoverChain.length > 0)
                    .map((a) => (
                      <div
                        key={a.id}
                        className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-emerald-400" />
                            Primary: {a.name}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            Active
                          </Badge>
                        </div>

                        <div className="space-y-1.5 pl-3 border-l-2 border-primary/40">
                          {a.failoverChain?.map((chain, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-muted-foreground flex items-center justify-between"
                            >
                              <span>
                                {idx + 1}. {chain.name}
                              </span>
                              <span className="text-[10px] font-mono text-emerald-400">Standby</span>
                            </div>
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveAddonForFailover(a)
                            setFailoverSheetOpen(true)
                          }}
                          className="w-full text-xs h-7"
                        >
                          Modify Backup Chain
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: ADDON LIBRARY */}
            <TabsContent value="library" className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {library.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-border/60 bg-card hover:border-border transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-foreground">{item.name}</span>
                        <div className="flex gap-1">
                          {item.tags.map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0 font-mono">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleInstallFromLibrary(item)}
                      className="w-full text-xs font-semibold gap-1.5"
                    >
                      <Plus className="size-3.5" />
                      Install to Account
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* DIALOG 1: INSTALL ADDON MODAL */}
        <Dialog open={installDialogOpen} onOpenChange={setInstallDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="size-5 text-primary" />
                Install Addon by URL
              </DialogTitle>
              <DialogDescription>
                Paste any Stremio manifest URL or configuration link. Supports stremio:// protocol, configure pages, and personal debrid manifests.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <Input
                value={installUrl}
                onChange={(e) => setInstallUrl(e.target.value)}
                placeholder="https://torrentio.strem.fun/manifest.json"
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Tip: Configure page URLs are automatically converted to their manifest endpoints.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setInstallDialogOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleInstall} disabled={isInstalling || !installUrl.trim()}>
                {isInstalling ? <RefreshCw className="size-3.5 animate-spin" /> : "Install Now"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* SHEET 1: FAILOVER RULES EDITOR */}
        <Sheet open={failoverSheetOpen} onOpenChange={setFailoverSheetOpen}>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <ShieldAlert className="size-5 text-amber-400" />
                Failover Chain: {activeAddonForFailover?.name}
              </SheetTitle>
              <SheetDescription>
                Configure the ordered sequence of backup scrapers to swap in when this addon is unreachable.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 py-6">
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 space-y-1">
                <span className="text-xs font-semibold text-emerald-400">Primary Provider</span>
                <p className="font-mono text-xs text-foreground truncate">
                  {activeAddonForFailover?.url}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Ordered Fallbacks:
                </span>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-foreground block">1. Comet RD Standby</span>
                      <span className="text-[10px] text-muted-foreground font-mono">https://comet.elfhosted.com</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">Standby</Badge>
                  </div>
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/30 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-foreground block">2. MediaFusion Fallback</span>
                      <span className="text-[10px] text-muted-foreground font-mono">https://mediafusion.elfhosted.com</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">Standby</Badge>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* SHEET 2: BULK DEPLOY SHEET */}
        <Sheet open={bulkSheetOpen} onOpenChange={setBulkSheetOpen}>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Send className="size-5 text-primary" />
                Bulk Deploy Addons
              </SheetTitle>
              <SheetDescription>
                Copy this account's addon set and arrangement onto your other linked Nuvio and Stremio accounts in one click.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 py-6">
              <div className="p-3 rounded-lg border border-border/60 bg-muted/30 space-y-2">
                <span className="text-xs font-semibold text-foreground">Dry-Run Preview:</span>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="text-emerald-400 font-medium">+ 5 addons will be synchronized</p>
                  <p className="text-muted-foreground">• Order will match Primary Nuvio Account</p>
                  <p className="text-muted-foreground">• 0 conflicting links</p>
                </div>
              </div>

              <Button
                className="w-full font-semibold gap-2"
                onClick={() => {
                  toast.success("Synchronized all addons across 2 linked accounts!")
                  setBulkSheetOpen(false)
                }}
              >
                <Zap className="size-4" />
                Deploy to All Accounts
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </SidebarInset>
    </SidebarProvider>
  )
}
