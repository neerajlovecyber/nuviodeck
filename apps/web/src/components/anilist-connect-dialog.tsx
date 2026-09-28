import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@workspace/ui/components/dialog'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Badge } from '@workspace/ui/components/badge'
import {
  ExternalLink,
  Loader2,
  CheckCircle2,
  User,
  Sparkles,
  Tv,
} from 'lucide-react'
import { toast } from 'sonner'
import { testApiKey } from '@/lib/test-key'

export function AniListLogo({ className = 'size-8' }: { className?: string }) {
  return (
    <div
      className={`grid place-items-center rounded-lg bg-[#02A9FF] text-white p-1 font-black text-xs shadow-sm ${className}`}
    >
      <span className="font-black text-xs tracking-tight">AL</span>
    </div>
  )
}

export interface AniListConnectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (data: { username: string; displayName?: string; avatarUrl?: string }) => void
}

export function AniListConnectDialog({
  open,
  onOpenChange,
  onSuccess,
}: AniListConnectDialogProps) {
  const [activeTab, setActiveTab] = React.useState<'username' | 'token'>('username')
  const [inputValue, setInputValue] = React.useState('')
  const [connecting, setConnecting] = React.useState(false)
  const [status, setStatus] = React.useState<'idle' | 'success'>('idle')
  const [connectedUser, setConnectedUser] = React.useState<{ username: string; avatarUrl?: string } | null>(null)

  React.useEffect(() => {
    if (open) {
      setInputValue('')
      setStatus('idle')
      setConnectedUser(null)
    }
  }, [open])

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = inputValue.trim()
    if (!clean) {
      toast.error(activeTab === 'username' ? 'Please enter your AniList username' : 'Please enter your AniList token')
      return
    }

    try {
      setConnecting(true)
      const res = await testApiKey('anilist', clean)

      if (res.status === 'valid') {
        const username = res.details?.details?.username || clean
        const avatarUrl = res.details?.details?.avatarUrl

        // Also save to server backend accountConnections table
        await fetch('/api/integrations/anilist/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: clean, username }),
        }).catch(() => null)

        setConnectedUser({ username, avatarUrl })
        setStatus('success')
        toast.success(`AniList connected as @${username}!`)
        onSuccess?.({ username, displayName: username, avatarUrl })
        setTimeout(() => onOpenChange(false), 1200)
      } else {
        toast.error(res.message || 'AniList user not found. Check spelling or privacy settings.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Verification failed')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground shadow-2xl p-0 overflow-hidden">
        {/* Top Accent Bar */}
        <div className="h-1.5 w-full bg-[#02A9FF]" />

        <div className="p-6 space-y-5">
          <DialogHeader className="flex flex-row items-center gap-3 space-y-0 text-left">
            <AniListLogo className="size-11 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-bold tracking-tight text-foreground">
                  Connect AniList Account
                </DialogTitle>
                <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider py-0 px-1.5 border-[#02A9FF]/30 text-[#02A9FF] bg-[#02A9FF]/5">
                  Anime
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Sync Watching, Plan to Watch, Completed lists, and track progress.
              </DialogDescription>
            </div>
          </DialogHeader>

          {status === 'success' && connectedUser ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="size-14 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center animate-in zoom-in-75 duration-300">
                <CheckCircle2 className="size-8" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Connected to AniList
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Linked as <span className="font-semibold text-foreground">@{connectedUser.username}</span>
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Your anime catalog rows and watch tracking are now active.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 p-1 bg-muted/50 rounded-lg border border-border text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('username')}
                  className={`py-1.5 px-3 rounded-md font-medium transition-colors cursor-pointer text-center ${
                    activeTab === 'username'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Public Username
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('token')}
                  className={`py-1.5 px-3 rounded-md font-medium transition-colors cursor-pointer text-center ${
                    activeTab === 'token'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Access Token (Scrobble)
                </button>
              </div>

              <form onSubmit={handleConnect} className="space-y-4 pt-1">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>{activeTab === 'username' ? 'AniList Username' : 'AniList Token'}</span>
                    <a
                      href={activeTab === 'username' ? 'https://anilist.co/' : 'https://anilist.co/api/v2/oauth/authorize?client_id=18884&response_type=token'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-primary hover:underline font-normal inline-flex items-center gap-1"
                    >
                      {activeTab === 'username' ? 'anilist.co' : 'Get Token'} <ExternalLink className="size-3" />
                    </a>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={activeTab === 'username' ? 'e.g. animefan_42' : 'Paste AniList bearer token'}
                      autoFocus
                      className="pl-9 h-10 text-sm font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {activeTab === 'username'
                      ? 'Validates directly with the official AniList GraphQL API to sync your public anime lists.'
                      : 'Allows full 2-way watch progress synchronization and scrobbling.'}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={connecting || !inputValue.trim()}
                  className="w-full bg-[#02A9FF] hover:bg-[#0295e0] text-white font-medium h-10 shadow-sm cursor-pointer gap-2"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Verifying with AniList...
                    </>
                  ) : (
                    'Connect AniList Account'
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
