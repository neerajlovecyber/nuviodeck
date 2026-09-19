import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Toaster } from '@workspace/ui/components/sonner'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased text-foreground">
      <Outlet />
      <Toaster richColors position="bottom-right" />
    </div>
  )
}
