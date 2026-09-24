import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { SidebarTrigger } from '@workspace/ui/components/sidebar'
import { Separator } from '@workspace/ui/components/separator'
import { Button } from '@workspace/ui/components/button'
import { ChevronLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { useWizard } from '../wizard-context'

export function WizardHeader() {
  const navigate = useNavigate()
  const { profileName } = useWizard()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center justify-between gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) px-4 lg:px-6">
      <div className="flex items-center gap-1.5 lg:gap-2 min-w-0">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-1 h-4 data-vertical:self-auto" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: '/dashboard' })}
          className="size-8 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
          title="Back to Profiles"
          aria-label="Back to Profiles"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex items-baseline gap-2 min-w-0">
          <h1 className="text-base font-medium truncate text-foreground">
            {profileName || 'New Profile'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}
