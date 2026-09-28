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
  AlertCircle,
  Copy,
  Check,
  User,
  Radio,
  Tv,
} from 'lucide-react'
import { toast } from 'sonner'

export function SimklLogo({ className = 'size-8' }: { className?: string }) {
  return (
    <div
      className={`grid place-items-center rounded-lg bg-[#000] text-[#00e676] border border-border p-1 font-bold text-xs shadow-sm ${className}`}
    >
      <span className="font-mono text-xs tracking-tighter">SIMKL</span>
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
  const [activeTab, setActiveTab] = React.useState<'pin' | 'username'>('pin')
  const [loadingPin, setLoadingPin] = React.useState(false)
  const [pinData, setPinData] = React.useState<{
    device_code: string
    user_code: string
    verification_url: string
  } | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [status, setStatus] = React.useState<'idle' | 'waiting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [connectedUser, setConnectedUser] = React.useState<{ username: string; avatarUrl?: string } | null>(null)
  const [usernameInput, setUsernameInput] = React.useState('')
  const [connectingUser, setConnectingUser] = React.useState(false)

  const pollIntervalRef = React.useRef<NodeJS.Timeout | null>(null)

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }

  // Load PIN code when opened on PIN tab
  React.useEffect(() => {
    if (open) {
      setStatus('idle')
      setErrorMsg(null)
      setConnectedUser(null)
      setUsernameInput('')
      if (activeTab === 'pin') {
        fetchPinCode()
      }
    } else {
      stopPolling()
    }
    return () => stopPolling()
  }, [open, activeTab])

  const fetchPinCode = async () => {
    try {
      stopPolling()
      setLoadingPin(true)
      setStatus('idle')
      setErrorMsg(null)

      const res = await fetch('/api/integrations/simkl/pin', { method: 'POST' })
      const data = await res.json()

      if (!res.ok || !data.device_code) {
        throw new Error(data.error || 'Failed to generate Simkl device pairing code')
      }

      setPinData({
        device_code: data.device_code,
        user_code: data.user_code,
        verification_url: data.verification_url || `https://simkl.com/pin?user_code=${data.user_code}`,
      })
      setStatus('waiting')

      // Start polling backend device code endpoint every 2s
      pollIntervalRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/integrations/simkl/pin/${data.device_code}`)
          const pollData = await pollRes.json()

          if (pollRes.ok && pollData.success && pollData.user) {
            stopPolling()
            setConnectedUser({
              username: pollData.user.username,
              avatarUrl: pollData.user.avatarUrl,
            })
            setStatus('success')
            toast.success(`Simkl connected as @${pollData.user.username}!`)
            onSuccess?.(pollData.user)
            setTimeout(() => onOpenChange(false), 1400)
          } else if (!pollData.pending && pollData.error) {
            stopPolling()
            setStatus('error')
            setErrorMsg(pollData.error)
          }
        } catch {
          // Keep polling
        }
      }, 2000)
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message || 'Could not initiate Simkl device authorization')
    } finally {
      setLoadingPin(false)
    }
  }

  const handleCopyCode = () => {
    if (pinData?.user_code) {
      navigator.clipboard.writeText(pinData.user_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.info('Simkl code copied to clipboard!')
    }
  }

  const handleOpenAuth = () => {
    if (pinData?.verification_url) {
      window.open(pinData.verification_url, '_blank')
    }
  }

  const handleUsernameConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = usernameInput.trim()
    if (!clean) {
      toast.error('Please enter your Simkl username')
      return
    }

    try {
      setConnectingUser(true)
      const res = await fetch('/api/integrations/simkl/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        const username = data.user?.username || clean
        setConnectedUser({ username })
        setStatus('success')
        toast.success(`Simkl connected as @${username}!`)
        onSuccess?.({ username, displayName: username })
        setTimeout(() => onOpenChange(false), 1200)
      } else {
        toast.error(data.error || 'Failed to link Simkl account')
      }
    } catch (err: any) {
      toast.error(err.message || 'Connection failed')
    } finally {
      setConnectingUser(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground shadow-2xl p-0 overflow-hidden">
        {/* Top Accent Bar */}
        <div className="h-1.5 w-full bg-[#00e676]" />

        <div className="p-6 space-y-5">
          <DialogHeader className="flex flex-row items-center gap-3 space-y-0 text-left">
            <SimklLogo className="size-11 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-bold tracking-tight text-foreground">
                  Connect Simkl Account
                </DialogTitle>
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase font-mono tracking-wider py-0 px-1.5 border-[#00e676]/30 text-[#00e676] bg-[#00e676]/5"
                >
                  Movies, TV, Anime
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Pair your Simkl account to sync Plan to Watch, tracking, and multi-platform rows.
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
                  Your Simkl library is active and synchronizing.
                </p>
              </div>
            </div>
          )}

          {/* TAB SWITCHER */}
          {status !== 'success' && (
            <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-lg text-xs font-medium border border-border">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('pin')
                  if (!pinData) fetchPinCode()
                }}
                className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'pin'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Radio className="size-3.5 text-[#00e676]" />
                <span>Pairing Code (Auto)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('username')}
                className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'username'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="size-3.5 text-[#00e676]" />
                <span>Username</span>
              </button>
            </div>
          )}

          {/* PIN PAIRING TAB */}
          {status !== 'success' && activeTab === 'pin' && (
            <div className="space-y-4 pt-1">
              {loadingPin ? (
                <div className="py-8 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="size-8 animate-spin text-[#00e676]" />
                  <p className="text-xs text-muted-foreground">Requesting Simkl pairing code...</p>
                </div>
              ) : status === 'error' ? (
                <div className="py-4 flex flex-col items-center text-center space-y-3">
                  <div className="size-10 rounded-full bg-destructive/10 text-destructive grid place-items-center">
                    <AlertCircle className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Pairing Failed</p>
                    <p className="text-xs text-muted-foreground max-w-xs">{errorMsg || 'Could not load Simkl code'}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={fetchPinCode}
                    className="bg-[#00e676] hover:bg-[#00c853] text-black font-semibold cursor-pointer"
                  >
                    Try Again
                  </Button>
                </div>
              ) : pinData ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-muted/40 border border-border text-center space-y-2">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                      Your Authorization Code
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-3xl font-extrabold tracking-widest text-[#00e676] select-all">
                        {pinData.user_code}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyCode}
                        className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Copy Code"
                      >
                        {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                      </Button>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] text-muted-foreground">
                      <Loader2 className="size-3 animate-spin text-[#00e676]" />
                      <span>Waiting for approval on simkl.com...</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={handleOpenAuth}
                      className="w-full bg-[#00e676] hover:bg-[#00c853] text-black font-bold h-10 shadow-md cursor-pointer gap-2"
                    >
                      <ExternalLink className="size-4" />
                      Open Simkl to Approve
                    </Button>
                    <p className="text-[11px] text-center text-muted-foreground">
                      Click the button above and click <strong>Approve</strong>. This dialog will connect automatically.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* USERNAME TAB */}
          {status !== 'success' && activeTab === 'username' && (
            <form onSubmit={handleUsernameConnect} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Simkl Username</label>
                <Input
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="e.g. johndoe"
                  className="h-10 text-xs"
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground">
                  Connect via your public Simkl profile name.
                </p>
              </div>

              <Button
                type="submit"
                disabled={connectingUser || !usernameInput.trim()}
                className="w-full bg-[#00e676] hover:bg-[#00c853] text-black font-bold h-10 shadow-md cursor-pointer gap-2"
              >
                {connectingUser ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    Connect Simkl
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
