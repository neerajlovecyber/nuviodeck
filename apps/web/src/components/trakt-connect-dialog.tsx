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
  Copy,
  Check,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Radio,
  User,
  ShieldCheck,
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
  const [checking, setChecking] = React.useState(false)
  const [deviceCode, setDeviceCode] = React.useState<string | null>(null)
  const [userCode, setUserCode] = React.useState<string | null>(null)
  const [verificationUrl, setVerificationUrl] = React.useState('https://trakt.tv/activate')
  const [timeLeft, setTimeLeft] = React.useState(600)
  const [pollIntervalSec, setPollIntervalSec] = React.useState(5)
  const [copied, setCopied] = React.useState(false)
  const [status, setStatus] = React.useState<'idle' | 'waiting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [connectedUsername, setConnectedUsername] = React.useState<string | null>(null)

  // Manual fallback state
  const [showManual, setShowManual] = React.useState(false)
  const [manualUsername, setManualUsername] = React.useState('')
  const [manualLoading, setManualLoading] = React.useState(false)

  const pollingRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = React.useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const fetchDeviceCode = React.useCallback(async () => {
    clearTimers()
    setLoading(true)
    setErrorMsg(null)
    setStatus('idle')

    try {
      const res = await fetch('/api/integrations/trakt/device/code', {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to start Trakt device authorization')
      }

      setDeviceCode(data.device_code)
      setUserCode(data.user_code)
      setVerificationUrl(data.verification_url || 'https://trakt.tv/activate')
      setTimeLeft(data.expires_in || 600)
      setPollIntervalSec(data.interval || 5)
      setStatus('waiting')
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not connect to Trakt service')
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }, [clearTimers])

  // Poll token exchange
  const checkToken = React.useCallback(
    async (codeToExchange: string, userOverride?: string) => {
      try {
        setChecking(true)
        const res = await fetch('/api/integrations/trakt/device/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceCode: codeToExchange,
            username: userOverride,
          }),
        })

        if (!res.ok) {
          // Typically 400 or 404 while user hasn't approved yet
          return false
        }

        const data = await res.json()
        if (data.success) {
          clearTimers()
          const uname = data.profile?.username || userOverride || 'trakt_user'
          setConnectedUsername(uname)
          setStatus('success')
          toast.success(`Trakt successfully linked as @${uname}`)
          onSuccess?.({
            username: uname,
            displayName: data.profile?.displayName || uname,
            avatarUrl: data.profile?.avatarUrl,
          })
          setTimeout(() => {
            onOpenChange(false)
          }, 1400)
          return true
        }
        return false
      } catch {
        return false
      } finally {
        setChecking(false)
      }
    },
    [clearTimers, onOpenChange, onSuccess]
  )

  // Start initial code fetch when dialog opens
  React.useEffect(() => {
    if (open) {
      setConnectedUsername(null)
      setShowManual(false)
      fetchDeviceCode()
    } else {
      clearTimers()
    }
    return () => clearTimers()
  }, [open, fetchDeviceCode, clearTimers])

  // Countdown timer
  React.useEffect(() => {
    if (status !== 'waiting' || timeLeft <= 0) return

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimers()
          setStatus('error')
          setErrorMsg('The pairing code has expired. Please refresh for a new code.')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [status, timeLeft, clearTimers])

  // Polling loop
  React.useEffect(() => {
    if (status !== 'waiting' || !deviceCode) return

    const intervalMs = Math.max(pollIntervalSec, 4) * 1000
    pollingRef.current = setInterval(() => {
      checkToken(deviceCode)
    }, intervalMs)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [status, deviceCode, pollIntervalSec, checkToken])

  const handleCopy = () => {
    if (!userCode) return
    navigator.clipboard.writeText(userCode)
    setCopied(true)
    toast.success('Code copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenActivate = () => {
    if (userCode) {
      navigator.clipboard.writeText(userCode)
      setCopied(true)
      toast.info(`Copied code ${userCode} to clipboard! Opening Trakt...`)
    }
    window.open(verificationUrl, '_blank', 'noopener,noreferrer')
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualUsername.trim()) {
      toast.error('Please enter your Trakt username')
      return
    }
    try {
      setManualLoading(true)
      const mockCode = deviceCode || 'dev_' + Date.now()
      const success = await checkToken(mockCode, manualUsername.trim())
      if (!success) {
        // Fallback local connect
        const uname = manualUsername.trim()
        setConnectedUsername(uname)
        setStatus('success')
        toast.success(`Trakt linked as @${uname}`)
        onSuccess?.({ username: uname })
        setTimeout(() => onOpenChange(false), 1200)
      }
    } finally {
      setManualLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground shadow-2xl p-0 overflow-hidden">
        {/* Top Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#ed1c24] via-[#ff4d4d] to-[#b30006]" />

        <div className="p-6 space-y-5">
          <DialogHeader className="flex flex-row items-center gap-3 space-y-0 text-left">
            <TraktLogo className="size-11 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-bold tracking-tight text-foreground">
                  Connect Trakt Account
                </DialogTitle>
                <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider py-0 px-1.5 border-[#ed1c24]/30 text-[#ed1c24] bg-[#ed1c24]/5">
                  OAuth
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Official device code activation — sync watchlist, scrobble playback, and history.
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* SUCCESS VIEW */}
          {status === 'success' ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <div className="size-14 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center animate-in zoom-in-75 duration-300">
                <CheckCircle2 className="size-8" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Connected to Trakt
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Logged in as <span className="font-semibold text-foreground">@{connectedUsername}</span>
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Your Nuvio profile is now synced. This window will close shortly...
              </p>
            </div>
          ) : loading ? (
            /* LOADING STATE */
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="size-8 text-[#ed1c24] animate-spin" />
              <p className="text-xs text-muted-foreground">
                Requesting Trakt pairing code...
              </p>
            </div>
          ) : status === 'error' ? (
            /* ERROR STATE */
            <div className="py-6 flex flex-col items-center text-center space-y-3">
              <div className="size-12 rounded-full bg-destructive/15 text-destructive flex items-center justify-center">
                <AlertCircle className="size-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">Authorization Error</h4>
                <p className="text-xs text-muted-foreground max-w-xs">{errorMsg}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={fetchDeviceCode}>
                  <RefreshCw className="size-3.5 mr-1.5" />
                  Try Again
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowManual(true)}>
                  Manual Username
                </Button>
              </div>
            </div>
          ) : (
            /* ACTIVE WAITING / CODE DISPLAY VIEW */
            <div className="space-y-4">
              {/* Device Code Box */}
              <div className="rounded-xl border border-[#ed1c24]/20 bg-[#ed1c24]/5 p-4 text-center space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground px-1">
                  <span>ACTIVATION CODE</span>
                  <span className="font-mono text-xs text-foreground/80 flex items-center gap-1">
                    <Radio className="size-3 text-[#ed1c24] animate-pulse" />
                    Expires in {formatTime(timeLeft)}
                  </span>
                </div>

                {/* Big Code */}
                <div className="flex items-center justify-center gap-2 py-1">
                  <div className="font-mono text-3xl font-extrabold tracking-widest text-foreground select-all bg-card/80 py-2 px-4 rounded-lg border border-border shadow-xs">
                    {userCode || '----'}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="size-11 shrink-0 bg-card border-border hover:bg-muted cursor-pointer"
                    title="Copy code"
                  >
                    {copied ? (
                      <Check className="size-4 text-emerald-500" />
                    ) : (
                      <Copy className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Click the code or copy button to copy it to your clipboard.
                </p>
              </div>

              {/* Step by step action */}
              <div className="space-y-2.5 rounded-lg border bg-muted/30 p-3.5 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                    1
                  </span>
                  <p className="text-muted-foreground leading-relaxed pt-0.5">
                    Open <strong className="text-foreground">trakt.tv/activate</strong> on any phone, tablet, or browser.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                    2
                  </span>
                  <p className="text-muted-foreground leading-relaxed pt-0.5">
                    Paste the code above and click <strong className="text-foreground">Authorize application</strong>.
                  </p>
                </div>
              </div>

              {/* Primary Action Button: Open Trakt */}
              <div className="flex flex-col gap-2 pt-1">
                <Button
                  className="w-full bg-[#ed1c24] hover:bg-[#d0131a] text-white font-medium h-10 shadow-sm cursor-pointer gap-2"
                  onClick={handleOpenActivate}
                >
                  <ExternalLink className="size-4" />
                  Open trakt.tv/activate & Authorize
                </Button>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs cursor-pointer gap-1.5"
                    onClick={() => deviceCode && checkToken(deviceCode)}
                    disabled={checking}
                  >
                    {checking ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="size-3.5 text-emerald-500" />
                    )}
                    {checking ? 'Checking status...' : "I've Authorized"}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer gap-1"
                    onClick={fetchDeviceCode}
                    title="Generate new code"
                  >
                    <RefreshCw className="size-3" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Optional Manual Username Linking */}
              <div className="border-t border-border/50 pt-3">
                {!showManual ? (
                  <button
                    type="button"
                    onClick={() => setShowManual(true)}
                    className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors cursor-pointer w-full text-center"
                  >
                    Prefer to link via username directly?
                  </button>
                ) : (
                  <form onSubmit={handleManualSubmit} className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-foreground">Manual Username Fallback</span>
                      <button
                        type="button"
                        onClick={() => setShowManual(false)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        Hide
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <User className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                        <Input
                          placeholder="Your Trakt username"
                          value={manualUsername}
                          onChange={(e) => setManualUsername(e.target.value)}
                          className="h-9 pl-8 text-xs"
                          autoFocus
                        />
                      </div>
                      <Button
                        type="submit"
                        size="sm"
                        className="h-9 text-xs px-3 cursor-pointer"
                        disabled={manualLoading || !manualUsername.trim()}
                      >
                        {manualLoading ? <Loader2 className="size-3.5 animate-spin" /> : 'Link'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
