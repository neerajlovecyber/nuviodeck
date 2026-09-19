import { Moon, Sun } from 'lucide-react'
import { useTheme } from './theme-provider'
import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn("size-9 transition-colors", className)}
      aria-label="Toggle theme"
      title="Toggle Light / Dark mode (or press 'd')"
    >
      {isDark ? (
        <Sun className="size-4.5 text-amber-400 hover:text-amber-300 transition-colors" />
      ) : (
        <Moon className="size-4.5 text-slate-700 hover:text-slate-900 transition-colors" />
      )}
    </Button>
  )
}
