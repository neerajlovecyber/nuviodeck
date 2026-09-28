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
  const [activeTab, setActiveTab] = React.useState<'username' | 'device'>('username')
  const [usernameInput, setUsernameInput] = React.useState('')
  const [connecting, setConnecting] = React.useState(false)

  // Device Code state
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

  // Direct Username Connect
  const handleConnectByUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = usernameInput.trim()
    if (!clean) {
      toast.error('Please enter your Trakt username')
      return
    }

    try {
      setConnecting(true)
      const res = await fetch('/api/integrations/trakt/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setConnectedUsername(clean)
        setStatus('success')
        toast.success(`Trakt linked successfully as @${clean}!`)
        onSuccess?.({
          username: clean,
          displayName: data.profile?.displayName || clean,
          avatarUrl: data.profile?.avatarUrl,
        })
        setTimeout(() => onOpenChange(false), 1200)
      } else {
        toast.error(data.error || 'Failed to link Trakt username')
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not connect to server')
    } finally {
      setConnecting(false)
    }
  }

  // Poll token exchange (only executes when device code exists and user is on device tab)
  const checkToken = React.useCallback(
    async (codeToExchange: string) => {
      if (!codeToExchange) return false
      try {
        setChecking(true)
        const res = await fetch('/api/integrations/trakt/device/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceCode: codeToExchange,
          }),
        })

        if (!res.ok) {
          return false
        }

        const data = await res.json()
        if (data.success && data.profile?.username) {
          clearTimers()
          const uname = data.profile.username
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
      setUsernameInput('')
      setStatus('idle')
      if (activeTab === 'device') {
        fetchDeviceCode()
      }
    } else {
      clearTimers()
    }
    return () => clearTimers()
  }, [open, activeTab, fetchDeviceCode, clearTimers])

  // Countdown timer
  React.useEffect(() => {
    if (status !== 'waiting' || timeLeft <= 0 || activeTab !== 'device') return

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
  }, [status, timeLeft, activeTab, clearTimers])

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
                  Tracker
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Sync your watchlists, personalized recommendations, and scrobbling.
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
                  Linked as <span className="font-semibold text-foreground">@{connectedUsername}</span>
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Your Nuvio profile is now synced. This window will close shortly...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tab selector */}
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
                  Enter Username
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('device')
                    if (!deviceCode) fetchDeviceCode()
                  }}
                  className={`py-1.5 px-3 rounded-md font-medium transition-colors cursor-pointer text-center ${
                    activeTab === 'device'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Device Activation PIN
                </button>
              </div>

              {activeTab === 'username' ? (
                /* USERNAME FORM TAB */
                <form onSubmit={handleConnectByUsername} className="space-y-4 pt-1">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span>Trakt.tv Username</span>
                      <a
                        href="https://trakt.tv/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-primary hover:underline font-normal inline-flex items-center gap-1"
                      >
                        trakt.tv <ExternalLink className="size-3" />
                      </a>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        placeholder="e.g. your_trakt_username"
                        autoFocus
                        className="pl-9 h-10 text-sm font-medium"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Enter your public Trakt username. This powers the Trakt Watchlist, Recommendations, and History rows.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={connecting || !usernameInput.trim()}
                    className="w-full bg-[#ed1c24] hover:bg-[#d0131a] text-white font-medium h-10 shadow-sm cursor-pointer gap-2"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect Trakt Account'
                    )}
                  </Button>
                </form>
              ) : (
                /* DEVICE ACTIVATION TAB */
                <div className="space-y-4">
                  {loading ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                      <Loader2 className="size-7 text-[#ed1c24] animate-spin" />
                      <p className="text-xs text-muted-foreground">Requesting Trakt code...</p>
                    </div>
                  ) : status === 'error' ? (
                    <div className="py-4 flex flex-col items-center text-center space-y-2">
                      <AlertCircle className="size-6 text-destructive" />
                      <p className="text-xs text-muted-foreground">{errorMsg}</p>
                      <Button size="sm" variant="outline" onClick={fetchDeviceCode}>
                        <RefreshCw className="size-3.5 mr-1.5" /> Try Again
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-xl border border-[#ed1c24]/20 bg-[#ed1c24]/5 p-4 text-center space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground px-1">
                          <span>ACTIVATION CODE</span>
                          <span className="font-mono text-xs text-foreground/80 flex items-center gap-1">
                            <Radio className="size-3 text-[#ed1c24] animate-pulse" />
                            Expires in {formatTime(timeLeft)}
                          </span>
                        </div>

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
                      </div>

                      <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-xs">
                        <p className="text-muted-foreground">
                          1. Visit <strong className="text-foreground">trakt.tv/activate</strong> and authorize the code.
                        </p>
                      </div>

                      <Button
                        className="w-full bg-[#ed1c24] hover:bg-[#d0131a] text-white font-medium h-10 shadow-sm cursor-pointer gap-2"
                        onClick={handleOpenActivate}
                      >
                        <ExternalLink className="size-4" />
                        Open trakt.tv/activate
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs cursor-pointer gap-1.5"
                        onClick={() => deviceCode && checkToken(deviceCode)}
                        disabled={checking}
                      >
                        {checking ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5 text-emerald-500" />}
                        {checking ? 'Checking authorization...' : "I've Authorized on Trakt"}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
