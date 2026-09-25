import { useRouterState } from "@tanstack/react-router"
import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { ThemeToggle } from "./theme-toggle"

export function SiteHeader({ title }: { title?: string }) {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })

  const getAutoTitle = () => {
    if (pathname === "/avatars" || pathname.startsWith("/avatars/")) return "Avatars"
    if (pathname === "/badges" || pathname.startsWith("/badges/")) return "Badges"
    if (pathname === "/settings" || pathname.startsWith("/settings/")) return "Settings"
    if (pathname === "/studio" || pathname.startsWith("/studio/")) return "Cover Studio"
    if (pathname === "/addons" || pathname.startsWith("/addons/")) return "Addon Manager"
    if (pathname === "/status" || pathname.startsWith("/status/")) return "System Status"
    if (pathname === "/whats-new" || pathname.startsWith("/whats-new/")) return "What's New"
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) return "Profiles"
    if (pathname.startsWith("/wizard/")) return "Profile Wizard"
    return "Profiles"
  }

  const displayTitle = title || getAutoTitle()

  return (
    <header className="flex h-14 md:h-(--header-height) shrink-0 items-center justify-between gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 px-4 lg:px-6">
      <div className="flex items-center gap-1 lg:gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        <h1 className="text-base font-medium">{displayTitle}</h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}
