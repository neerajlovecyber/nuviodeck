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
  Check,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Film,
} from 'lucide-react'
import { toast } from 'sonner'

export function TmdbLogo({ className = 'size-8' }: { className?: string }) {
  return (
    <div
      className={`grid place-items-center rounded-lg bg-gradient-to-r from-[#90cea1] to-[#01b4e4] text-[#0d253f] p-1 font-black text-xs shadow-sm ${className}`}
    >
      <span className="font-black text-[11px] tracking-tight text-[#0d253f]">TMDB</span>
    </div>
  )
}

export interface TmdbConnectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (data: { username: string; sessionId?: string }) => void
}

export function TmdbConnectDialog({
  open,
  onOpenChange,
  onSuccess,
}: TmdbConnectDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [approving, setApproving] = React.useState(false)
  const [requestToken, setRequestToken] = React.useState<string | null>(null)
  const [authUrl, setAuthUrl] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<'idle' | 'waiting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [connectedUsername, setConnectedUsername] = React.useState<string | null>(null)

  const pollingRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const clearPolling = React.useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const startAuthFlow = React.useCallback(async () => {
    clearPolling()
    setLoading(true)
    setErrorMsg(null)
    setStatus('idle')

    try {
      const res = await fetch('/api/integrations/tmdb/request-token', {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to start TMDB authorization')
      }

      setRequestToken(data.requestToken)
      setAuthUrl(data.authUrl)
      setStatus('waiting')
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not connect to TMDB service')
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }, [clearPolling])

  const completeSession = React.useCallback(
    async (tokenToUse: string, isAuto = false) => {
      if (approving && !isAuto) return
      setApproving(true)
      setErrorMsg(null)

      try {
        const res = await fetch('/api/integrations/tmdb/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestToken: tokenToUse }),
        })
        const data = await res.json()

        if (res.ok && data.success) {
          clearPolling()
          setStatus('success')
          const username = data.session?.username || 'TMDBUser'
          setConnectedUsername(username)
          toast.success(`Successfully connected TMDB (@${username})!`)
          onSuccess?.({ username, sessionId: data.session?.sessionId })
          return
        }

        if (!isAuto) {
          setErrorMsg(data.error || 'Please click Approve on the TMDB page before confirming.')
        }
      } catch (err: any) {
        if (!isAuto) {
          setErrorMsg(err.message || 'Verification failed')
        }
      } finally {
        setApproving(false)
      }
    },
    [approving, clearPolling, onSuccess]
  )

  React.useEffect(() => {
    if (!open) {
      clearPolling()
      setStatus('idle')
      setRequestToken(null)
      setAuthUrl(null)
      return
    }

    startAuthFlow()

    return () => {
      clearPolling()
    }
  }, [open, startAuthFlow, clearPolling])

  // Periodic check after user opens auth URL
  React.useEffect(() => {
    if (status !== 'waiting' || !requestToken) return

    pollingRef.current = setInterval(() => {
      completeSession(requestToken, true)
    }, 4000)

    return () => {
      clearPolling()
    }
  }, [status, requestToken, completeSession, clearPolling])

  const handleOpenAuth = () => {
    if (!authUrl) return
    window.open(authUrl, '_blank', 'noopener,noreferrer,width=700,height=800')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border border-border shadow-2xl p-0 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-[#01b4e4]/15 via-background to-card p-6 border-b border-border/60">
          <div className="flex items-center gap-3">
            <TmdbLogo className="size-10 shadow-md ring-1 ring-[#01b4e4]/30" />
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                Connect TMDB Account
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider border-[#01b4e4]/40 text-[#01b4e4]">
                  OAuth Session
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Sync Watchlist, Favorites, Ratings, and custom TMDB lists
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* SUCCESS STATE */}
          {status === 'success' && (
            <div className="py-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="size-14 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 grid place-items-center ring-8 ring-emerald-500/5">
                <CheckCircle2 className="size-8" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  TMDB Connected!
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Connected as <span className="font-semibold text-foreground">@{connectedUsername}</span>. Your TMDB account lists are now available.
                </p>
              </div>
              <Button
                className="w-full bg-[#01b4e4] hover:bg-[#01b4e4]/90 text-slate-900 font-semibold"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            </div>
          )}

          {/* LOADING STATE */}
          {loading && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="size-8 mx-auto animate-spin text-[#01b4e4]" />
              <p className="text-xs text-muted-foreground">Requesting authorization from TMDB...</p>
            </div>
          )}

          {/* WAITING / ACTIVE AUTH FLOW */}
          {!loading && status === 'waiting' && authUrl && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="rounded-xl border border-[#01b4e4]/20 bg-[#01b4e4]/5 p-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 text-xs text-foreground font-medium">
                    <span className="size-5 rounded-full bg-[#01b4e4]/20 text-[#01b4e4] font-bold grid place-items-center text-[10px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Open the TMDB approval window and click <strong>Approve</strong> to allow Nuvio access to your account.
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                    <span className="size-5 rounded-full bg-[#01b4e4]/20 text-[#01b4e4] font-bold grid place-items-center text-[10px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Return here — Nuvio will automatically detect approval, or you can click "I Have Approved" below.
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  className="w-full bg-[#01b4e4] hover:bg-[#01b4e4]/90 text-slate-900 font-semibold flex items-center justify-center gap-2 h-10"
                  onClick={handleOpenAuth}
                >
                  <ExternalLink className="size-4" />
                  Open TMDB Approval Window
                </Button>

                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 h-10 border-border hover:bg-muted font-medium"
                  disabled={approving}
                  onClick={() => requestToken && completeSession(requestToken, false)}
                >
                  {approving ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-[#01b4e4]" />
                      <span>Verifying Approval...</span>
                    </>
                  ) : (
                    <>
                      <Check className="size-4 text-emerald-400" />
                      <span>I Have Approved on TMDB</span>
                    </>
                  )}
                </Button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Live Listening Indicator */}
              <div className="flex items-center justify-center gap-2 py-1 text-xs text-muted-foreground">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#01b4e4] opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2 bg-[#01b4e4]"></span>
                </span>
                <span>Listening for TMDB authorization response...</span>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {!loading && status === 'error' && (
            <div className="py-4 text-center space-y-4">
              <div className="size-12 mx-auto rounded-full bg-destructive/10 text-destructive grid place-items-center">
                <AlertCircle className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Failed to start TMDB Auth</p>
                <p className="text-xs text-muted-foreground">{errorMsg || 'Could not reach TMDB API'}</p>
              </div>
              <Button variant="default" onClick={startAuthFlow} className="bg-[#01b4e4] text-slate-900 font-semibold">
                <RefreshCw className="size-3.5 mr-2" />
                Retry
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
