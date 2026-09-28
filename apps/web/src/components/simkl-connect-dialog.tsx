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

export function SimklLogo({ className = 'size-8' }: { className?: string }) {
  return (
    <div
      className={`grid place-items-center rounded-lg bg-[#0ea5e9] text-white p-1 font-black text-xs shadow-sm ${className}`}
    >
      <span className="tracking-tighter font-extrabold text-[11px]">SIMKL</span>
    </div>
  )
}

export interface SimklConnectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (data: { username: string; displayName?: string; avatarUrl?: string }) => void
}

export function SimklConnectDialog({
  open,
  onOpenChange,
  onSuccess,
}: SimklConnectDialogProps) {
  const [activeTab, setActiveTab] = React.useState<'username' | 'pin'>('username')
  const [usernameInput, setUsernameInput] = React.useState('')
  const [connecting, setConnecting] = React.useState(false)

  // PIN state
  const [loading, setLoading] = React.useState(false)
  const [checking, setChecking] = React.useState(false)
  const [userCode, setUserCode] = React.useState<string | null>(null)
  const [verificationUrl, setVerificationUrl] = React.useState('https://simkl.com/pin')
  const [timeLeft, setTimeLeft] = React.useState(600)
  const [pollIntervalSec, setPollIntervalSec] = React.useState(4)
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

  const fetchPinCode = React.useCallback(async () => {
    clearTimers()
    setLoading(true)
    setErrorMsg(null)
    setStatus('idle')

    try {
      const res = await fetch('/api/integrations/simkl/pin', {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to start Simkl PIN authorization')
      }

      setUserCode(data.user_code)
      setVerificationUrl(data.verification_url || 'https://simkl.com/pin')
      setTimeLeft(data.expires_in || 600)
      setPollIntervalSec(data.interval || 4)
      setStatus('waiting')
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not connect to Simkl PIN service')
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }, [clearTimers])

  const checkAuthorization = React.useCallback(
    async (codeToPoll: string) => {
      if (checking) return
      setChecking(true)

      try {
        const res = await fetch(`/api/integrations/simkl/pin/${encodeURIComponent(codeToPoll)}`)
        const data = await res.json()

        if (data.connected && data.user?.name) {
          clearTimers()
          setStatus('success')
          const username = data.user.name || data.user.username
          setConnectedUsername(username)
          toast.success(`Successfully connected Simkl (@${username})!`)
          onSuccess?.({
            username,
            displayName: data.user.name,
            avatarUrl: data.user.avatar,
          })
          return
        }

        if (data.result === 'KO' || data.error === 'expired') {
          clearTimers()
          setStatus('error')
          setErrorMsg('The PIN has expired. Please request a new PIN.')
        }
      } catch (err: any) {
        console.warn('Simkl PIN check failed:', err)
      } finally {
        setChecking(false)
      }
    },
    [checking, clearTimers, onSuccess]
  )

  const handleConnectByUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = usernameInput.trim()
    if (!clean) {
      toast.error('Please enter your Simkl username')
      return
    }

    try {
      setConnecting(true)
      const res = await fetch('/api/integrations/simkl/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setConnectedUsername(clean)
        setStatus('success')
        toast.success(`Connected Simkl as @${clean}`)
        onSuccess?.({ username: clean, displayName: clean })
        setTimeout(() => onOpenChange(false), 1200)
      } else {
        toast.error(data.error || 'Failed to connect Simkl account')
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not reach server')
    } finally {
      setConnecting(false)
    }
  }

  // Start polling when in waiting state
  React.useEffect(() => {
    if (!open) {
      clearTimers()
      setStatus('idle')
      setUserCode(null)
      setUsernameInput('')
      return
    }

    if (activeTab === 'pin') {
      fetchPinCode()
    }

    return () => {
      clearTimers()
    }
  }, [open, activeTab, fetchPinCode, clearTimers])

  React.useEffect(() => {
    if (status !== 'waiting' || !userCode || activeTab !== 'pin') {
      return
    }

    const pollMs = Math.max(pollIntervalSec, 4) * 1000
    pollingRef.current = setInterval(() => {
      checkAuthorization(userCode)
    }, pollMs)

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimers()
          setStatus('error')
          setErrorMsg('Code expired. Please request a new PIN.')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearTimers()
    }
  }, [status, userCode, activeTab, pollIntervalSec, checkAuthorization, clearTimers])

  const handleCopyCode = () => {
    if (!userCode) return
    navigator.clipboard.writeText(userCode)
    setCopied(true)
    toast.success('PIN copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border border-border shadow-2xl p-0 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-sky-500/15 via-background to-card p-6 border-b border-border/60">
          <div className="flex items-center gap-3">
            <SimklLogo className="size-10 shadow-md ring-1 ring-sky-500/30" />
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                Connect Simkl Account
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider border-sky-500/40 text-sky-400">
                  PIN Auth
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Link your Plan to Watch list, TV progress, and anime scrobbling
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
                  Simkl Connected!
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Signed in as <span className="font-semibold text-foreground">@{connectedUsername}</span>. Your watch progress and lists are synced.
                </p>
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            </div>
          )}

          {/* Tab selector */}
          {status !== 'success' && (
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
                  setActiveTab('pin')
                  if (!userCode) fetchPinCode()
                }}
                className={`py-1.5 px-3 rounded-md font-medium transition-colors cursor-pointer text-center ${
                  activeTab === 'pin'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Simkl PIN Code
              </button>
            </div>
          )}

          {/* USERNAME FORM TAB */}
          {status !== 'success' && activeTab === 'username' && (
            <form onSubmit={handleConnectByUsername} className="space-y-4 pt-1">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Simkl.com Username</span>
                  <a
                    href="https://simkl.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-sky-400 hover:underline font-normal inline-flex items-center gap-1"
                  >
                    simkl.com <ExternalLink className="size-3" />
                  </a>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="e.g. your_simkl_username"
                    autoFocus
                    className="pl-9 h-10 text-sm font-medium"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Enter your Simkl username. This enables Simkl Plan to Watch, Recommendations, and History catalogs.
                </p>
              </div>

              <Button
                type="submit"
                disabled={connecting || !usernameInput.trim()}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium h-10 shadow-sm cursor-pointer gap-2"
              >
                {connecting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Simkl Account'
                )}
              </Button>
            </form>
          )}

          {/* LOADING STATE */}
          {status !== 'success' && activeTab === 'pin' && loading && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="size-8 mx-auto animate-spin text-sky-400" />
              <p className="text-xs text-muted-foreground">Requesting PIN code from Simkl...</p>
            </div>
          )}

          {/* WAITING / ACTIVE PIN FLOW */}
          {status !== 'success' && activeTab === 'pin' && !loading && status === 'waiting' && userCode && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Step instructions */}
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <span className="size-5 rounded-full bg-sky-500/20 text-sky-400 font-bold grid place-items-center text-[10px]">
                      1
                    </span>
                    Enter this code on Simkl:
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    Expires in {formatTime(timeLeft)}
                  </span>
                </div>

                {/* Big Code Tile */}
                <div className="relative group flex items-center justify-center p-3 rounded-lg bg-background/80 border border-border shadow-inner">
                  <span className="font-mono text-3xl font-extrabold tracking-widest text-sky-400 select-all">
                    {userCode}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyCode}
                    className="absolute right-2 text-xs flex items-center gap-1 h-8 text-muted-foreground hover:text-foreground"
                  >
                    {copied ? (
                      <>
                        <Check className="size-3.5 text-emerald-400" />
                        <span className="text-[11px] text-emerald-400 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-5 rounded-full bg-sky-500/20 text-sky-400 font-bold grid place-items-center text-[10px]">
                    2
                  </span>
                  <span>
                    Authorize at{' '}
                    <a
                      href={verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline font-semibold"
                    >
                      simkl.com/pin
                    </a>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-medium flex items-center justify-center gap-2"
                  onClick={() => window.open(verificationUrl, '_blank', 'noopener,noreferrer')}
                >
                  <ExternalLink className="size-4" />
                  Open simkl.com/pin
                </Button>
                <Button
                  variant="outline"
                  onClick={() => checkAuthorization(userCode)}
                  disabled={checking}
                  className="px-3"
                  title="Check now"
                >
                  {checking ? (
                    <Loader2 className="size-4 animate-spin text-sky-400" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                </Button>
              </div>

              {/* Live Listening Indicator */}
              <div className="flex items-center justify-center gap-2 py-1 text-xs text-muted-foreground">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2 bg-sky-500"></span>
                </span>
                <span>Waiting for approval on Simkl...</span>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {status !== 'success' && activeTab === 'pin' && !loading && status === 'error' && (
            <div className="py-4 text-center space-y-4">
              <div className="size-12 mx-auto rounded-full bg-destructive/10 text-destructive grid place-items-center">
                <AlertCircle className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Authorization Failed</p>
                <p className="text-xs text-muted-foreground">{errorMsg || 'Could not verify code'}</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="default" onClick={fetchPinCode} className="bg-sky-600 hover:bg-sky-500">
                  <RefreshCw className="size-3.5 mr-2" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('username')}>
                  Enter Username
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
