import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@workspace/ui/components/button'
import { useAppStore } from '../store/useStore'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { theme, toggleTheme, user } = useAppStore()

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your application preferences.</p>
      </div>

      <div className="p-6 rounded-xl border bg-card shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm">Theme Preference</h3>
            <p className="text-xs text-muted-foreground">Current Theme: {theme.toUpperCase()}</p>
          </div>
          <Button variant="outline" size="sm" onClick={toggleTheme}>
            Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
          </Button>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium text-sm">User Profile</h3>
          <p className="text-xs text-muted-foreground mt-1">{user?.name} ({user?.email})</p>
        </div>
      </div>
    </div>
  )
}
