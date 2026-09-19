import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import {
  SidebarInset,
  SidebarProvider,
} from '@workspace/ui/components/sidebar'
import {
  MoreHorizontal,
  Plus,
  Download,
  Upload,
  Layers,
  Folder,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  FileJson,
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
} from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { Textarea } from '@workspace/ui/components/textarea'
import { Checkbox } from '@workspace/ui/components/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@workspace/ui/components/alert-dialog'
import { toast } from 'sonner'
import { nuvioApi, DeckProfile } from '@/lib/nuvio-api'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function formatTimeAgo(isoString: string): string {
  if (!isoString) return '1d ago'
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return '1d ago'
    return `${diffDays}d ago`
  } catch {
    return '1d ago'
  }
}

function DashboardPage() {
  // Profiles state
  const [profiles, setProfiles] = React.useState<DeckProfile[]>([])
  const [loading, setLoading] = React.useState(true)

  // Connected accounts
  const [sessions, setSessions] = React.useState<any[]>([])

  // Modals state
  const [newProfileOpen, setNewProfileOpen] = React.useState(false)
  const [newProfileName, setNewProfileName] = React.useState('')
  const [newProfileRows, setNewProfileRows] = React.useState('24')
  const [newProfileCollections, setNewProfileCollections] = React.useState('1')
  const [newProfileBadgeSet, setNewProfileBadgeSet] = React.useState('xp_aurora')

  const [importOpen, setImportOpen] = React.useState(false)
  const [importJson, setImportJson] = React.useState('')

  const [editProfile, setEditProfile] = React.useState<DeckProfile | null>(null)
  const [editName, setEditName] = React.useState('')
  const [editRows, setEditRows] = React.useState('24')
  const [editCollections, setEditCollections] = React.useState('1')

  const [deleteProfile, setDeleteProfile] = React.useState<DeckProfile | null>(null)

  // Deploy modal state
  const [deployProfile, setDeployProfile] = React.useState<DeckProfile | null>(null)
  const [deployTargetAccounts, setDeployTargetAccounts] = React.useState<string[]>([])
  const [deploySelectedSlots, setDeploySelectedSlots] = React.useState<number[]>([1])
  const [deployBadges, setDeployBadges] = React.useState(true)
  const [deployAvatar, setDeployAvatar] = React.useState(true)
  const [deployCollections, setDeployCollections] = React.useState(true)
  const [deployAddons, setDeployAddons] = React.useState(true)
  const [isDeploying, setIsDeploying] = React.useState(false)
  const [deployReport, setDeployReport] = React.useState<any[] | null>(null)

  // Load profiles from backend
  const loadProfiles = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await nuvioApi.getDeckProfiles()
      if (res.profiles) {
        setProfiles(res.profiles)
      }
    } catch (err: any) {
      console.error('Failed to load deck profiles:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load accounts
  const loadSessions = React.useCallback(async () => {
    try {
      const res = await nuvioApi.getConnectedSessions()
      if (res.sessions) {
        setSessions(res.sessions)
        if (res.sessions.length > 0) {
          setDeployTargetAccounts([res.sessions[0].id])
        }
      }
    } catch (err: any) {
      console.error('Failed to load sessions:', err)
    }
  }, [])

  React.useEffect(() => {
    loadProfiles()
    loadSessions()
  }, [loadProfiles, loadSessions])

  // Handle Set Active
  const handleSetActive = async (profile: DeckProfile) => {
    try {
      await nuvioApi.updateDeckProfile(profile.id, { isActive: true })
      setProfiles((prev) =>
        prev.map((p) => ({
          ...p,
          isActive: p.id === profile.id,
        }))
      )
      toast.success(`"${profile.name}" set as active profile!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to set active')
    }
  }

  // Handle Create Profile
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProfileName.trim()) {
      toast.error('Please enter a profile name')
      return
    }

    try {
      const res = await nuvioApi.createDeckProfile({
        name: newProfileName.trim(),
        rowCount: parseInt(newProfileRows, 10) || 24,
        collectionCount: parseInt(newProfileCollections, 10) || 1,
        badgeSetId: newProfileBadgeSet,
      })

      if (res.profile) {
        setProfiles((prev) => [res.profile, ...prev])
        toast.success(`Profile "${res.profile.name}" created!`)
        setNewProfileName('')
        setNewProfileOpen(false)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create profile')
    }
  }

  // Handle Edit Profile
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editProfile || !editName.trim()) return

    try {
      const res = await nuvioApi.updateDeckProfile(editProfile.id, {
        name: editName.trim(),
        rowCount: parseInt(editRows, 10) || 24,
        collectionCount: parseInt(editCollections, 10) || 1,
      })

      if (res.profile) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === editProfile.id ? { ...p, ...res.profile } : p))
        )
        toast.success(`Profile updated`)
        setEditProfile(null)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
    }
  }

  // Handle Delete Profile
  const handleDelete = async () => {
    if (!deleteProfile) return
    try {
      await nuvioApi.deleteDeckProfile(deleteProfile.id)
      setProfiles((prev) => prev.filter((p) => p.id !== deleteProfile.id))
      toast.success(`Profile "${deleteProfile.name}" deleted`)
      setDeleteProfile(null)
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete profile')
    }
  }

  // Handle Import Config
  const handleImportConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importJson.trim()) {
      toast.error('Please paste configuration JSON')
      return
    }

    try {
      const parsed = JSON.parse(importJson)
      const res = await nuvioApi.importDeckProfile(parsed)
      if (res.profile) {
        setProfiles((prev) => [res.profile, ...prev])
        toast.success(`Config "${res.profile.name}" imported successfully!`)
        setImportJson('')
        setImportOpen(false)
      }
    } catch (err: any) {
      toast.error(err.message || 'Invalid JSON configuration')
    }
  }

  // Handle Export Config
  const handleExportConfig = (profile: DeckProfile) => {
    const exportData = {
      name: profile.name,
      rowCount: profile.rowCount,
      collectionCount: profile.collectionCount,
      badgeSetId: profile.badgeSetId,
      exportedAt: new Date().toISOString(),
      ...(profile.configJson ? JSON.parse(profile.configJson) : {}),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${profile.name.toLowerCase().replace(/\s+/g, '_')}_config.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Exported ${profile.name} configuration`)
  }

  // Handle Open Deploy
  const handleOpenDeploy = (profile: DeckProfile) => {
    setDeployProfile(profile)
    setDeployReport(null)
    if (sessions.length > 0 && deployTargetAccounts.length === 0) {
      setDeployTargetAccounts([sessions[0].id])
    }
  }

  // Handle Deploy
  const handleExecuteDeploy = async () => {
    if (!deployProfile) return
    if (deployTargetAccounts.length === 0) {
      toast.error('Please select at least one target Nuvio account')
      return
    }
    if (deploySelectedSlots.length === 0) {
      toast.error('Please select at least one profile slot (1-6)')
      return
    }

    try {
      setIsDeploying(true)
      const targets = deployTargetAccounts.map((accountId) => ({
        accountId,
        slots: deploySelectedSlots,
      }))

      const res = await nuvioApi.deployDeckProfile(deployProfile.id, {
        targets,
        options: {
          pushBadges: deployBadges,
          pushAvatar: deployAvatar,
          pushCollections: deployCollections,
          pushAddons: deployAddons,
        },
      })

      if (res.report) {
        setDeployReport(res.report)
        const successCount = res.report.filter((r) => r.status === 'success').length
        toast.success(`Successfully deployed to ${successCount} target slot(s)!`)
      }
    } catch (err: any) {
      toast.error(err.message || 'Deployment failed')
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '16rem',
          '--header-height': '3.5rem',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        
        <div className="flex-1 px-6 py-8 md:px-10 lg:px-12 max-w-7xl">
          {/* Top Header matching Xperience screenshot */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                My profiles
              </h1>
              <p className="text-sm text-muted-foreground mt-1 font-normal">
                {profiles.length} configuration{profiles.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setImportOpen(true)}
                className="h-9 px-4 text-sm font-medium border-border/80 rounded-lg hover:bg-accent/60 transition-colors inline-flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Import config
              </Button>

              <Button
                onClick={() => setNewProfileOpen(true)}
                className="h-9 px-4 text-sm font-medium bg-[#6366f1] hover:bg-[#5558e6] text-white rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                New profile
              </Button>
            </div>
          </div>

          {/* Cards Grid or Empty State */}
          {profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 p-12 text-center my-4 bg-card/30">
              <div className="h-12 w-12 rounded-full bg-accent/60 flex items-center justify-center text-muted-foreground mb-4">
                <Folder className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No profiles yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
                You haven't created any profile configurations. Create your first profile or import an existing configuration.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setImportOpen(true)}
                  className="h-9 px-4 text-sm font-medium border-border/80 rounded-lg hover:bg-accent/60 transition-colors inline-flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Import config
                </Button>
                <Button
                  onClick={() => setNewProfileOpen(true)}
                  className="h-9 px-4 text-sm font-medium bg-[#6366f1] hover:bg-[#5558e6] text-white rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  New profile
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="group relative rounded-2xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md hover:border-border transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Card Header: Title & 3-Dots */}
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-foreground truncate">
                        {profile.name}
                      </h3>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-md -mr-1"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Profile actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => handleOpenDeploy(profile)}
                            className="font-medium text-[#6366f1] focus:text-[#6366f1]"
                          >
                            <Send className="mr-2 h-4 w-4 text-[#6366f1]" />
                            Deploy to Nuvio...
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {!profile.isActive && (
                            <DropdownMenuItem onClick={() => handleSetActive(profile)}>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Set as Active
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setEditProfile(profile)
                              setEditName(profile.name)
                              setEditRows(String(profile.rowCount || 24))
                              setEditCollections(String(profile.collectionCount || 1))
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportConfig(profile)}>
                            <FileJson className="mr-2 h-4 w-4" />
                            Export config
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteProfile(profile)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete profile
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-1.5 mt-2.5 mb-5">
                      {profile.isActive && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#818cf8]/15 text-[#6366f1] dark:bg-[#818cf8]/20 dark:text-[#a5b4fc]">
                          Active
                        </span>
                      )}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#10b981]/15 text-[#059669] dark:bg-[#10b981]/20 dark:text-[#34d399]">
                        Ready
                      </span>
                    </div>
                  </div>

                  {/* Bottom Metadata stats row */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border/40">
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-muted-foreground/80" />
                      <span>{profile.rowCount || 24} rows</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Folder className="h-3.5 w-3.5 text-muted-foreground/80" />
                      <span>
                        {profile.collectionCount || 1} collection
                        {profile.collectionCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/80" />
                      <span>{formatTimeAgo(profile.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deploy to Nuvio Modal */}
        <Dialog open={!!deployProfile} onOpenChange={(open) => !open && setDeployProfile(null)}>
          <DialogContent className="sm:max-w-[540px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Send className="h-5 w-5 text-[#6366f1]" />
                Deploy "{deployProfile?.name}" to Nuvio
              </DialogTitle>
              <DialogDescription>
                Push this profile configuration across any of your connected Nuvio accounts and profile slots.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Target Accounts Selection */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Target Nuvio Account(s)
                </Label>
                {sessions.length === 0 ? (
                  <div className="mt-2 p-3 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>No Nuvio accounts connected yet. Please connect an account via the sidebar switcher.</span>
                  </div>
                ) : (
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto pr-1">
                    {sessions.map((session) => {
                      const isSelected = deployTargetAccounts.includes(session.id)
                      return (
                        <div
                          key={session.id}
                          onClick={() => {
                            setDeployTargetAccounts((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== session.id)
                                : [...prev, session.id]
                            )}
                          }
                          className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-[#6366f1] bg-[#6366f1]/5 dark:bg-[#6366f1]/10'
                              : 'border-border hover:bg-accent/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => {}}
                            />
                            <span className="text-sm font-medium">{session.email}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Slot {session.activeProfileIndex || 1}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Target Profile Slots (1 to 6) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Target Profile Slots
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-[#6366f1] hover:text-[#5558e6] px-1.5"
                    onClick={() => {
                      if (deploySelectedSlots.length === 6) {
                        setDeploySelectedSlots([1])
                      } else {
                        setDeploySelectedSlots([1, 2, 3, 4, 5, 6])
                      }
                    }}
                  >
                    {deploySelectedSlots.length === 6 ? 'Deselect All' : 'Select All (1–6)'}
                  </Button>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((slot) => {
                    const isSlotSelected = deploySelectedSlots.includes(slot)
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          setDeploySelectedSlots((prev) =>
                            isSlotSelected
                              ? prev.filter((s) => s !== slot)
                              : [...prev, slot].sort((a, b) => a - b)
                          )
                        }}
                        className={`py-2 text-center rounded-lg border text-sm font-medium transition-all ${
                          isSlotSelected
                            ? 'border-[#6366f1] bg-[#6366f1] text-white shadow-xs'
                            : 'border-border hover:border-border/80 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        P{slot}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Items to Sync */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Sync Options
                </Label>
                <div className="grid grid-cols-2 gap-2.5 mt-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:bg-accent/40 cursor-pointer text-xs font-medium">
                    <Checkbox
                      checked={deployBadges}
                      onCheckedChange={(c) => setDeployBadges(!!c)}
                    />
                    <span>Badges & Preset</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:bg-accent/40 cursor-pointer text-xs font-medium">
                    <Checkbox
                      checked={deployAvatar}
                      onCheckedChange={(c) => setDeployAvatar(!!c)}
                    />
                    <span>Avatar</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:bg-accent/40 cursor-pointer text-xs font-medium">
                    <Checkbox
                      checked={deployCollections}
                      onCheckedChange={(c) => setDeployCollections(!!c)}
                    />
                    <span>Collections</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:bg-accent/40 cursor-pointer text-xs font-medium">
                    <Checkbox
                      checked={deployAddons}
                      onCheckedChange={(c) => setDeployAddons(!!c)}
                    />
                    <span>Addons</span>
                  </label>
                </div>
              </div>

              {/* Deployment Report */}
              {deployReport && (
                <div className="p-3.5 rounded-lg bg-accent/40 border border-border text-xs space-y-2">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Deployment Report:
                  </div>
                  <div className="space-y-1">
                    {deployReport.map((r, idx) => (
                      <div key={idx} className="flex items-center justify-between text-muted-foreground">
                        <span>{r.accountEmail || r.accountId} (Slot {r.slot})</span>
                        <span className={r.status === 'success' ? 'text-emerald-600 font-medium' : 'text-red-500'}>
                          {r.status === 'success' ? 'Deployed' : r.error || 'Failed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setDeployProfile(null)}
                disabled={isDeploying}
              >
                Close
              </Button>
              <Button
                onClick={handleExecuteDeploy}
                disabled={isDeploying || deployTargetAccounts.length === 0 || deploySelectedSlots.length === 0}
                className="bg-[#6366f1] hover:bg-[#5558e6] text-white"
              >
                {isDeploying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Push Configuration
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Profile Modal */}
        <Dialog open={newProfileOpen} onOpenChange={setNewProfileOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg">Create New Profile</DialogTitle>
              <DialogDescription>
                Create a standalone Deck profile configuration to customize and deploy.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateProfile} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Profile Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Cinema 4K, Anime Deck, Kids"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rows">Rows Count</Label>
                  <Input
                    id="rows"
                    type="number"
                    min={1}
                    max={100}
                    value={newProfileRows}
                    onChange={(e) => setNewProfileRows(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="collections">Collections</Label>
                  <Input
                    id="collections"
                    type="number"
                    min={1}
                    max={20}
                    value={newProfileCollections}
                    onChange={(e) => setNewProfileCollections(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="badgeset">Default Badge Preset</Label>
                <Select value={newProfileBadgeSet} onValueChange={setNewProfileBadgeSet}>
                  <SelectTrigger id="badgeset">
                    <SelectValue placeholder="Select badge preset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xp_aurora">Aurora (Vibrant Teal/Purple)</SelectItem>
                    <SelectItem value="xp_onyx">Onyx (Sleek Minimal Slate)</SelectItem>
                    <SelectItem value="xp_velvet">Velvet (Luxury Crimson Gold)</SelectItem>
                    <SelectItem value="xp_cyber">Cyberpunk (Neon Glow)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNewProfileOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#6366f1] hover:bg-[#5558e6] text-white"
                >
                  Create Profile
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Import Config Modal */}
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-lg">Import Configuration</DialogTitle>
              <DialogDescription>
                Paste a exported JSON configuration or Xperience profile layout.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleImportConfig} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="importJson">Configuration JSON</Label>
                <Textarea
                  id="importJson"
                  rows={8}
                  placeholder={`{\n  "name": "My Custom Profile",\n  "rowCount": 28,\n  "collectionCount": 2,\n  "badgeSetId": "xp_aurora"\n}`}
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setImportOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#6366f1] hover:bg-[#5558e6] text-white"
                >
                  Import Profile
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Profile Modal */}
        <Dialog open={!!editProfile} onOpenChange={(open) => !open && setEditProfile(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg">Edit Profile Details</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="editName">Profile Name</Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="editRows">Rows Count</Label>
                  <Input
                    id="editRows"
                    type="number"
                    value={editRows}
                    onChange={(e) => setEditRows(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editCols">Collections</Label>
                  <Input
                    id="editCols"
                    type="number"
                    value={editCollections}
                    onChange={(e) => setEditCollections(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditProfile(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <AlertDialog open={!!deleteProfile} onOpenChange={(open) => !open && setDeleteProfile(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete profile "{deleteProfile?.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This profile configuration will be removed from your local Nuviodeck storage.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
