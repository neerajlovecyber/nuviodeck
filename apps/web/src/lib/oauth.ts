import { toast } from 'sonner'

export async function startOAuthFlow(
  provider: 'trakt' | 'simkl',
  onSuccess: (profile: { username: string; displayName?: string; avatarUrl?: string }) => void
): Promise<void> {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const res = await fetch(`/api/integrations/${provider}/auth-url?origin=${encodeURIComponent(origin)}`)
    const data = await res.json()

    if (!res.ok || !data.authUrl) {
      throw new Error(data.error || `Failed to start ${provider} authorization`)
    }

    const width = 600
    const height = 700
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(
      data.authUrl,
      `${provider}OAuthWindow`,
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`
    )

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      toast.error('Browser blocked the popup window. Please allow popups for NuvioDeck.')
      return
    }

    let completed = false

    const handleSuccess = (profile: { username: string; displayName?: string; avatarUrl?: string }) => {
      if (completed) return
      completed = true
      cleanup()
      toast.success(`${provider === 'trakt' ? 'Trakt' : 'Simkl'} connected as @${profile.username}!`)
      onSuccess(profile)
    }

    // 1. PostMessage listener
    const messageListener = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return
      if (event.data.type === 'oauth_complete' && event.data.provider === provider) {
        if (event.data.success && event.data.profile) {
          handleSuccess(event.data.profile)
        } else if (event.data.error) {
          completed = true
          cleanup()
          toast.error(event.data.error)
        }
      }
    }

    // 2. Storage event listener (fires across tabs/popups)
    const storageListener = (event: StorageEvent) => {
      if (event.key === 'nuviodeck_oauth_result' && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue)
          if (parsed.type === 'oauth_complete' && parsed.provider === provider && parsed.success && parsed.profile) {
            localStorage.removeItem('nuviodeck_oauth_result')
            handleSuccess(parsed.profile)
          }
        } catch {}
      }
    }

    // 3. Fallback Poll: Check backend database status every 1000ms while popup is open
    const pollTimer = setInterval(async () => {
      if (completed) return
      try {
        const statusRes = await fetch('/api/integrations/status')
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          const providerStatus = statusData.integrations?.[provider]
          if (providerStatus?.connected && providerStatus.username) {
            handleSuccess({
              username: providerStatus.username,
              displayName: providerStatus.displayName || providerStatus.username,
              avatarUrl: providerStatus.avatarUrl,
            })
          }
        }
      } catch {}

      // If popup closed without postMessage, do final check then cleanup
      if (popup.closed) {
        setTimeout(async () => {
          if (completed) return
          try {
            const finalRes = await fetch('/api/integrations/status')
            if (finalRes.ok) {
              const finalData = await finalRes.json()
              const finalStatus = finalData.integrations?.[provider]
              if (finalStatus?.connected && finalStatus.username) {
                handleSuccess({
                  username: finalStatus.username,
                  displayName: finalStatus.displayName || finalStatus.username,
                  avatarUrl: finalStatus.avatarUrl,
                })
                return
              }
            }
          } catch {}
          cleanup()
        }, 800)
      }
    }, 1000)

    const cleanup = () => {
      window.removeEventListener('message', messageListener)
      window.removeEventListener('storage', storageListener)
      clearInterval(pollTimer)
    }

    window.addEventListener('message', messageListener)
    window.addEventListener('storage', storageListener)
  } catch (err: any) {
    toast.error(err.message || `Could not connect to ${provider}`)
  }
}
