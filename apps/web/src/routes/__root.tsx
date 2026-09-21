import { useEffect } from 'react'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Toaster } from '@workspace/ui/components/sonner'
import { useAppStore } from '@/store/useStore'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const checkSession = useAppStore((s) => s.checkSession)

  useEffect(() => {
    checkSession()
  }, [checkSession])

  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground">
      <Outlet />
      <Toaster richColors position="bottom-right" />
    </div>
  )
}
