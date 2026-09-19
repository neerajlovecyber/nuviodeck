import { useRouterState } from "@tanstack/react-router"
import { Separator } from "@workspace/ui/components/separator"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { ThemeToggle } from "./theme-toggle"

export function SiteHeader({ title }: { title?: string }) {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })

  const displayTitle =
    title ||
    (pathname === "/avatars" || pathname.startsWith("/avatars/")
      ? "Avatars"
      : pathname === "/badges" || pathname.startsWith("/badges/")
      ? "Badges"
      : pathname === "/settings"
      ? "Settings"
      : pathname === "/dashboard"
      ? "Profiles"
      : "Profiles")

  return (
    <header className="flex h-(--header-height) shrink-0 items-center justify-between gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) px-4 lg:px-6">
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
