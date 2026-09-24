import * as React from 'react'
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Lock,
  Radio,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { Switch } from '@workspace/ui/components/switch'
import { toast } from 'sonner'
import { useWizard } from '../wizard-context'
import {
  DebridProviderType,
  StreamFormatterPreset,
  StreamProxyType,
} from '../wizard-types'

export function Step4Streams() {
  const {
    streamsEnabled,
    setStreamsEnabled,
    selectedDebridProvider,
    setSelectedDebridProvider,
    debridVerified,
    setDebridVerified,
    debridApiKey,
    setDebridApiKey,
    showDebridKey,
    setShowDebridKey,
    streamSources,
    setStreamSources,
    formatterPreset,
    setFormatterPreset,
    cachedOnly,
    setCachedOnly,
    excludePreDigital,
    setExcludePreDigital,
    enabledResolutions,
    setEnabledResolutions,
    maxPerResolution,
    setMaxPerResolution,
    streamProxyEnabled,
    setStreamProxyEnabled,
    streamProxyType,
    setStreamProxyType,
    streamProxyPassword,
    setStreamProxyPassword,
    streamProxyUrl,
    setStreamProxyUrl,
  } = useWizard()

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col animate-in fade-in-50 duration-200">
      <header className="shrink-0 border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
              Streams
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Configure stream scrapers, debrid credentials, formatter presets, and resolution
              filters.
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              streamsEnabled
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <span
              className={`size-2 rounded-full ${
                streamsEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'
              }`}
            />
            {streamsEnabled ? 'Streams Active' : 'Disabled'}
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-6 pt-6 pb-10">
        {/* Master Switch */}
        <section className="flex items-center justify-between gap-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Zap className="size-5" />
            </div>
            <div>
              <Label
                htmlFor="master-streams-switch"
                className="text-base font-semibold text-foreground cursor-pointer"
              >
                Enable Stream Scrapers & Resolvers
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                When enabled, NuvioDeck resolves playable streams from your configured debrid
                providers and scraper addons alongside your catalogs.
              </p>
            </div>
          </div>
          <Switch
            id="master-streams-switch"
            checked={streamsEnabled}
            onCheckedChange={setStreamsEnabled}
          />
        </section>

        {streamsEnabled && (
          <>
            {/* 1. Debrid Provider */}
            <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Key className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Debrid Service Provider
                  </h3>
                </div>
                {selectedDebridProvider !== 'none' && debridVerified && (
                  <span className="inline-flex h-5 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3 shrink-0" /> Verified & Active
                  </span>
                )}
              </div>

              {/* Provider selection tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'realdebrid',
                    name: 'Real-Debrid',
                    desc: 'Fast & popular cached torrents',
                    link: 'https://real-debrid.com/apitoken',
                  },
                  {
                    id: 'torbox',
                    name: 'TorBox',
                    desc: 'High-speed debrid & Usenet',
                    link: 'https://torbox.app/settings',
                  },
                  {
                    id: 'alldebrid',
                    name: 'AllDebrid',
                    desc: 'Multi-hoster & torrent cache',
                    link: 'https://alldebrid.com/apikeys',
                  },
                  {
                    id: 'premiumize',
                    name: 'Premiumize.me',
                    desc: 'Cloud storage & torrent cache',
                    link: 'https://www.premiumize.me/account',
                  },
                  {
                    id: 'debridlink',
                    name: 'Debrid-Link',
                    desc: 'Fast French & global seedbox',
                    link: 'https://debrid-link.com/webapp/register',
                  },
                  {
                    id: 'none',
                    name: 'None (Free P2P)',
                    desc: 'Direct peer-to-peer torrents only',
                    link: '',
                  },
                ].map((prov) => (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => {
                      setSelectedDebridProvider(prov.id as DebridProviderType)
                      if (prov.id === 'none') {
                        setDebridVerified(true)
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      selectedDebridProvider === prov.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary text-foreground'
                        : 'border-border bg-background/50 hover:bg-accent/40 text-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-xs text-foreground">{prov.name}</span>
                      {selectedDebridProvider === prov.id && (
                        <div className="size-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="text-[11px] leading-snug line-clamp-1">{prov.desc}</span>
                  </button>
                ))}
              </div>

              {/* API Key Input */}
              {selectedDebridProvider !== 'none' && (
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-foreground">
                      {selectedDebridProvider.toUpperCase()} API Key / Token
                    </Label>
                    <a
                      href={
                        selectedDebridProvider === 'realdebrid'
                          ? 'https://real-debrid.com/apitoken'
                          : selectedDebridProvider === 'torbox'
                          ? 'https://torbox.app/settings'
                          : selectedDebridProvider === 'alldebrid'
                          ? 'https://alldebrid.com/apikeys'
                          : selectedDebridProvider === 'premiumize'
                          ? 'https://www.premiumize.me/account'
                          : 'https://debrid-link.com/webapp/register'
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Get API key <ExternalLink className="size-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showDebridKey ? 'text' : 'password'}
                        value={debridApiKey}
                        onChange={(e) => {
                          setDebridApiKey(e.target.value)
                          setDebridVerified(false)
                        }}
                        placeholder="Paste your debrid API token..."
                        className="h-10 pr-10 font-mono text-xs bg-background"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDebridKey(!showDebridKey)}
                        className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showDebridKey ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        if (!debridApiKey.trim()) {
                          toast.error('Please enter a valid API key')
                          return
                        }
                        setDebridVerified(true)
                        toast.success(
                          `${selectedDebridProvider.toUpperCase()} verified successfully!`
                        )
                      }}
                      className="h-10 px-4 text-xs font-medium shrink-0 cursor-pointer"
                    >
                      Verify
                    </Button>
                  </div>
                </div>
              )}
            </section>

            {/* 2. Scraper / Stream Sources */}
            <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Radio className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Scraper Sources</h3>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {streamSources.filter((s) => s.enabled).length} active
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {streamSources.map((source) => (
                  <div
                    key={source.id}
                    className={`p-3.5 rounded-xl border transition-colors ${
                      source.enabled
                        ? 'bg-background border-border shadow-xs'
                        : 'bg-card/40 border-dashed border-border/70 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {source.name}
                          </span>
                          {source.enabled && (
                            <span className="size-2 rounded-full bg-emerald-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{source.description}</p>
                      </div>
                      <Switch
                        checked={source.enabled}
                        onCheckedChange={(checked) => {
                          setStreamSources((prev) =>
                            prev.map((s) => (s.id === source.id ? { ...s, enabled: checked } : s))
                          )
                        }}
                      />
                    </div>
                    {source.enabled && (
                      <div className="mt-2.5 pt-2.5 border-t border-border/40 flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                          Host URL:
                        </span>
                        <Input
                          value={source.url}
                          onChange={(e) => {
                            const newUrl = e.target.value
                            setStreamSources((prev) =>
                              prev.map((s) => (s.id === source.id ? { ...s, url: newUrl } : s))
                            )
                          }}
                          className="h-7 text-xs font-mono bg-card"
                          placeholder="https://..."
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Stream Formatter & Live Stream Card Preview */}
            <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Stream Formatter Engine
                  </h3>
                </div>
                <span className="text-xs text-primary font-medium">Live Preview</span>
              </div>

              {/* Preset selection buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[
                  { id: 'nuvio', label: 'Nuvio Deck' },
                  { id: 'prism', label: 'Prism' },
                  { id: 'charcoal', label: 'Charcoal' },
                  { id: 'streamsense', label: 'StreamSense' },
                  { id: 'ned', label: "Ned's" },
                  { id: 'linden', label: 'Linden' },
                  { id: 'shota', label: 'Shota' },
                  { id: 'tamtaro', label: 'Tamtaro' },
                  { id: 'plain', label: 'Plain' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFormatterPreset(p.id as StreamFormatterPreset)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      formatterPreset === p.id
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-background hover:bg-accent text-muted-foreground hover:text-foreground border-border'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Interactive Stream Result Preview Box */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>How streams appear on Nuvio / Stremio:</span>
                  <span className="font-mono text-[11px] text-primary">
                    {formatterPreset.toUpperCase()} FORMAT
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-primary/30 bg-background/90 space-y-2 font-mono text-xs shadow-inner">
                  {formatterPreset === 'nuvio' && (
                    <>
                      <div className="flex items-center justify-between text-foreground font-bold">
                        <span>🔥 4K ⚡ 〈Remux〉</span>
                        <span className="text-amber-500 font-sans">⭐️ 9.2</span>
                      </div>
                      <div className="text-foreground/90 font-sans font-medium">
                        Dune: Part Two (2024) · 2h 46m
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        🎞️ HEVC 📺 DV · HDR10+ 🎧 Atmos · TrueHD 🔊 7.1
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        📦 42.8 GB · 📊 85 Mbps · 🌱 340 · ⏱️ 2d ago
                      </div>
                      <div className="text-primary text-[11px] flex items-center justify-between">
                        <span>🛡️ [RD] Torrentio · 🏷️ FraMeSToR</span>
                        <span>🌎 EN · ES · FR</span>
                      </div>
                    </>
                  )}

                  {formatterPreset === 'prism' && (
                    <>
                      <div className="text-primary font-bold">🔥4K UHD 🚀 FHD</div>
                      <div className="text-foreground/90 font-sans font-medium">
                        🎬 Dune: Part Two (2024)
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        🎥 Remux 📺 DV | HDR10+ 🎞️ HEVC ⏱️ 2h 46m
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        🎧 Atmos | TrueHD 🔊 7.1 · 📦 42.8 GB 🌱 340 📅 2d
                      </div>
                      <div className="text-emerald-500 text-[11px]">
                        🏷️ FraMeSToR 🔍Torrentio ⚡Ready (RD) 🗣️ 🇺🇸 / 🇪🇸
                      </div>
                    </>
                  )}

                  {formatterPreset === 'charcoal' && (
                    <>
                      <div className="text-foreground font-bold">🔲 4K │ ⛁ 42.8 GB</div>
                      <div className="text-muted-foreground text-[11px]">
                        ☰ EN · ES · FR • Atmos • 7.1
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        ☲ BluRay REMUX · HEVC • DV · HDR10+
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        ☵ Torrentio · FraMeSToR · [RD]
                      </div>
                      <div className="text-primary text-[11px]">
                        ☶ Dune: Part Two · 2024 · 2h 46m
                      </div>
                    </>
                  )}

                  {formatterPreset === 'streamsense' && (
                    <>
                      <div className="text-foreground font-bold">
                        ⚜️ 4K UHD ❖ Torrentio [RD ⚡️]
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        🎥 Remux 🎞️ HEVC 💠 DV | HDR10+ 🏷️ FraMeSToR
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        🔊 Atmos 🎧 7.1 📦 42.8 GB | 🗣 🇺🇸 / 🇪🇸
                      </div>
                      <div className="text-primary text-[11px]">🎬 Dune: Part Two (2024)</div>
                    </>
                  )}

                  {formatterPreset === 'ned' && (
                    <>
                      <div className="text-foreground font-bold">✨⠀2160p⠀🌱⠀340</div>
                      <div className="text-foreground/90 font-sans font-medium">
                        🎟️ Dune: Part Two (2024)
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        🎥 BluRay REMUX 📺 DV | HDR10+ 🎞️ HEVC 🎧 Atmos 🔊 7.1
                      </div>
                      <div className="text-primary text-[11px]">
                        📦 42.8 GB 🏷️ FraMeSToR 📚 ᴍᴜʟᴛɪ 🏆 IMAX
                      </div>
                    </>
                  )}

                  {formatterPreset === 'linden' && (
                    <>
                      <div className="text-foreground font-bold">
                        4K | DV ° HDR10+ 🔱 Torrentio
                      </div>
                      <div className="text-foreground/90 font-sans font-medium">
                        🎬 Dune: Part Two (2024)
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        🎥 BluRay REMUX 🎞️ HEVC 🎧 Atmos • TrueHD「7.1」
                      </div>
                      <div className="text-primary text-[11px]">
                        📦 42.8 GB | 🌱 340 🌐 EN • ES • FR
                      </div>
                    </>
                  )}

                  {formatterPreset === 'shota' && (
                    <>
                      <div className="text-foreground font-bold">🖥️ 2160p</div>
                      <div className="text-foreground/90 font-sans font-medium">
                        📁 Dune: Part Two (2024)
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        🎥 BluRay REMUX 🎞️ DV | HDR10+ 🎧 Atmos
                      </div>
                      <div className="text-emerald-500 text-[11px]">📦 42.8 GB 💚 Torrentio</div>
                    </>
                  )}

                  {formatterPreset === 'tamtaro' && (
                    <>
                      <div className="text-foreground font-bold">4K ⚡ ⟨Remux⟩ ⭐️ 9.2</div>
                      <div className="text-foreground/90 font-sans font-medium">
                        ✏️ Dune: Part Two (2024)
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        🎞️ HEVC 📺 DV · HDR10+ 🎧 Atmos 🔊 7.1
                      </div>
                      <div className="text-primary text-[11px]">
                        📦 42.8 GB · 📊 85 Mbps · 🌱 340 🌐 [RD] Torrentio
                      </div>
                    </>
                  )}

                  {formatterPreset === 'plain' && (
                    <>
                      <div className="text-foreground font-bold">Cached 2160p</div>
                      <div className="text-muted-foreground text-[11px] truncate">
                        Dune.Part.Two.2024.2160p.UHD.Remux.HEVC.DV.Atmos-FraMeSToR.mkv
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        BluRay REMUX | HEVC | DV | HDR10+
                      </div>
                      <div className="text-primary text-[11px]">
                        Atmos | 7.1 | 42.8 GB | via Torrentio
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* 4. Quality & Resolution Rules */}
            <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2 border-b pb-3">
                <Sliders className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Quality & Resolution Rules
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-background">
                  <Checkbox
                    id="cached-only"
                    checked={cachedOnly}
                    onCheckedChange={(c) => setCachedOnly(!!c)}
                  />
                  <Label
                    htmlFor="cached-only"
                    className="text-xs font-medium text-foreground cursor-pointer select-none"
                  >
                    <span className="block font-semibold">Cached streams only</span>
                    <span className="text-muted-foreground text-[11px]">
                      Instant playback without P2P seeding
                    </span>
                  </Label>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-xl border bg-background">
                  <Checkbox
                    id="exclude-predigital"
                    checked={excludePreDigital}
                    onCheckedChange={(c) => setExcludePreDigital(!!c)}
                  />
                  <Label
                    htmlFor="exclude-predigital"
                    className="text-xs font-medium text-foreground cursor-pointer select-none"
                  >
                    <span className="block font-semibold">Exclude Pre-Digital</span>
                    <span className="text-muted-foreground text-[11px]">
                      Filters CAM, TS, SCR, HDCAM
                    </span>
                  </Label>
                </div>
              </div>

              {/* Resolution checkboxes */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-medium text-foreground">Allowed Resolutions</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: '2160p', label: '4K (2160p)' },
                    { id: '1440p', label: '2K (1440p)' },
                    { id: '1080p', label: 'FHD (1080p)' },
                    { id: '720p', label: 'HD (720p)' },
                    { id: '480p', label: 'SD (480p)' },
                  ].map((res) => {
                    const active = enabledResolutions.includes(res.id)
                    return (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => {
                          setEnabledResolutions((prev) =>
                            active ? prev.filter((r) => r !== res.id) : [...prev, res.id]
                          )
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          active
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-background border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {res.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Max per resolution */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <Label className="font-medium text-foreground">
                    Max streams per resolution
                  </Label>
                  <span className="font-mono text-muted-foreground font-semibold">
                    {maxPerResolution === 0 ? 'Unlimited' : `${maxPerResolution} streams`}
                  </span>
                </div>
                <div className="flex gap-2">
                  {[5, 10, 15, 25, 0].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMaxPerResolution(val)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        maxPerResolution === val
                          ? 'bg-accent text-foreground border-border font-semibold shadow-xs'
                          : 'bg-background text-muted-foreground hover:text-foreground border-border/70'
                      }`}
                    >
                      {val === 0 ? 'All' : val}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* 5. Streaming Proxy / MediaFlow */}
            <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Streaming Proxy (MediaFlow / StremThru)
                  </h3>
                </div>
                <Switch
                  checked={streamProxyEnabled}
                  onCheckedChange={setStreamProxyEnabled}
                />
              </div>

              {streamProxyEnabled && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Proxy Type</Label>
                      <select
                        value={streamProxyType}
                        onChange={(e) => setStreamProxyType(e.target.value as StreamProxyType)}
                        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-xs"
                      >
                        <option value="mediaflow">MediaFlow</option>
                        <option value="stremthru">StremThru</option>
                        <option value="generic">Generic Reverse Proxy</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">API Password</Label>
                      <Input
                        type="password"
                        value={streamProxyPassword}
                        onChange={(e) => setStreamProxyPassword(e.target.value)}
                        placeholder="Password..."
                        className="h-9 text-xs bg-background"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Proxy Host URL</Label>
                    <Input
                      value={streamProxyUrl}
                      onChange={(e) => setStreamProxyUrl(e.target.value)}
                      placeholder="https://mediaflow.example.com"
                      className="h-9 text-xs font-mono bg-background"
                    />
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
