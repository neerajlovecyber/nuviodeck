import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAppStore } from '@/store/useStore'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const user = useAppStore((s) => s.user)
  const isLoadingSession = useAppStore((s) => s.isLoadingSession)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoadingSession && !user) {
      navigate({ to: '/login' })
    }
  }, [user, isLoadingSession, navigate])

  if (isLoadingSession) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background gap-3">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
            N
          </div>
          Nuviodeck
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" />
          Checking session...
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
