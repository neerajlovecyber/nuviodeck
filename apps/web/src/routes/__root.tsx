import { createRootRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'
import { ThemeToggle } from '@/components/theme-toggle'
import { Toaster } from '@workspace/ui/components/sonner'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })
  const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/')
  const isAvatars = pathname === '/avatars' || pathname.startsWith('/avatars/')
  const isBadges = pathname === '/badges' || pathname.startsWith('/badges/')
  const isLanding = pathname === '/'

  if (isDashboard || isAvatars || isBadges || isLanding) {
    return (
      <div className="min-h-screen bg-background font-sans antialiased text-foreground">
        <Outlet />
        <Toaster richColors position="bottom-right" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground">
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            N
          </div>
          <span className="font-semibold text-lg tracking-tight">Nuviodeck</span>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            to="/"
            activeProps={{ className: 'text-primary font-semibold' }}
            inactiveProps={{ className: 'text-muted-foreground hover:text-foreground transition-colors' }}
          >
            Home
          </Link>
          <Link
            to="/dashboard"
            activeProps={{ className: 'text-primary font-semibold' }}
            inactiveProps={{ className: 'text-muted-foreground hover:text-foreground transition-colors' }}
          >
            Dashboard
          </Link>
          <ThemeToggle />
        </nav>
      </header>
      <main className="container mx-auto p-6">
        <Outlet />
      </main>
      <Toaster richColors position="bottom-right" />
    </div>
  )
}
