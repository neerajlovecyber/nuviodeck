import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@workspace/ui/components/dialog'
import { Button } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import {
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Radio,
  Tv,
} from 'lucide-react'
import { toast } from 'sonner'

export function TraktLogo({ className = 'size-8' }: { className?: string }) {
  return (
    <div
      className={`grid place-items-center rounded-lg bg-[#ed1c24] text-white p-1 font-black text-xs shadow-sm ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
      </svg>
    </div>
  )
}

export interface TraktConnectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (data: { username: string; displayName?: string; avatarUrl?: string }) => void
}

export function TraktConnectDialog({
  open,
  onOpenChange,
  onSuccess,
}: TraktConnectDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [status, setStatus] = React.useState<'idle' | 'waiting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [connectedUser, setConnectedUser] = React.useState<{ username: string; avatarUrl?: string } | null>(null)

  const popupRef = React.useRef<Window | null>(null)

  // Automatically start OAuth on open
  React.useEffect(() => {
    if (open) {
      setStatus('idle')
      setErrorMsg(null)
      setConnectedUser(null)
      handleStartOAuth()
    }
  }, [open])

  // Listen for OAuth message from popup window
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return
      if (event.data.type === 'oauth_complete' && event.data.provider === 'trakt') {
        if (event.data.success && event.data.profile) {
          const profile = event.data.profile
          setConnectedUser({ username: profile.username, avatarUrl: profile.avatarUrl })
          setStatus('success')
          toast.success(`Trakt connected as @${profile.username}!`)
          onSuccess?.(profile)
          setTimeout(() => onOpenChange(false), 1200)
        } else if (event.data.error) {
          setStatus('error')
          setErrorMsg(event.data.error)
          toast.error(event.data.error)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onOpenChange, onSuccess])

  const handleStartOAuth = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)

      const res = await fetch('/api/integrations/trakt/auth-url')
      const data = await res.json()

      if (!res.ok || !data.authUrl) {
        throw new Error(data.error || 'Failed to start Trakt authentication')
      }

      const width = 600
      const height = 700
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2

      const popup = window.open(
        data.authUrl,
        'TraktOAuthWindow',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`
      )

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        toast.error('Popup blocked by browser. Please allow popups for NuvioDeck.')
        setStatus('error')
        setErrorMsg('Popup was blocked. Please enable popups in your browser and try again.')
        return
      }

      popupRef.current = popup
      setStatus('waiting')
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message || 'Could not connect to Trakt')
      toast.error(err.message || 'Authentication error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground shadow-2xl p-0 overflow-hidden">
        {/* Top Accent Bar */}
        <div className="h-1.5 w-full bg-[#ed1c24]" />

        <div className="p-6 space-y-5">
          <DialogHeader className="flex flex-row items-center gap-3 space-y-0 text-left">
            <TraktLogo className="size-11 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-bold tracking-tight text-foreground">
                  Connect Trakt Account
                </DialogTitle>
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase font-mono tracking-wider py-0 px-1.5 border-[#ed1c24]/30 text-[#ed1c24] bg-[#ed1c24]/5"
                >
                  Movies & TV
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Sign in with your Trakt account to sync watchlists, history, and real-time scrobbling.
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* SUCCESS STATE */}
          {status === 'success' && connectedUser && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3 animate-in fade-in duration-300">
              <div className="size-12 rounded-full bg-emerald-500/15 text-emerald-400 grid place-items-center">
                <CheckCircle2 className="size-7" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Connected as @{connectedUser.username}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your Trakt account is active and synchronizing.
                </p>
              </div>
            </div>
          )}

          {/* WAITING / ACTIVE POPUP STATE */}
          {status === 'waiting' && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in">
              <div className="relative">
                <Loader2 className="size-8 animate-spin text-[#ed1c24]" />
                <span className="absolute -bottom-1 -right-1 flex size-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ed1c24] opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-3 bg-[#ed1c24]"></span>
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Waiting for Trakt Authorization...</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Please log in and approve NuvioDeck in the popup window.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartOAuth}
                className="text-xs border-border hover:bg-muted cursor-pointer gap-1.5"
              >
                <ExternalLink className="size-3.5" /> Re-open Popup
              </Button>
            </div>
          )}

          {/* ERROR STATE */}
          {status === 'error' && (
            <div className="py-4 flex flex-col items-center text-center space-y-3">
              <div className="size-10 rounded-full bg-destructive/10 text-destructive grid place-items-center">
                <AlertCircle className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Authorization Failed</p>
                <p className="text-xs text-muted-foreground max-w-xs">{errorMsg || 'Could not complete Trakt login'}</p>
              </div>
              <Button
                size="sm"
                onClick={handleStartOAuth}
                className="bg-[#ed1c24] hover:bg-[#d0131a] text-white font-medium cursor-pointer"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* IDLE / READY TO CONNECT */}
          {status === 'idle' && (
            <div className="space-y-4 pt-1">
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Tv className="size-4 text-[#ed1c24]" />
                  <span>Features unlocked with Trakt:</span>
                </div>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-1">
                  <li>Automatic watch history & scrobbling</li>
                  <li>Trakt Watchlist & Recommendations catalogs</li>
                  <li>Cross-device sync with Trakt.tv</li>
                </ul>
              </div>

              <Button
                onClick={handleStartOAuth}
                disabled={loading}
                className="w-full bg-[#ed1c24] hover:bg-[#d0131a] text-white font-semibold h-11 shadow-md cursor-pointer gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Opening Trakt...
                  </>
                ) : (
                  <>
                    <ExternalLink className="size-4" />
                    Sign in with Trakt
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
