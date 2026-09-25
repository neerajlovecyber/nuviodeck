import * as React from "react"
import { useRouterState } from "@tanstack/react-router"
import { useAppStore } from "@/store/useStore"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar"
import {
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  Home,
  Tag,
  VenetianMask,
  Palette,
  Layers,
  Activity,
  Sparkles,
} from "lucide-react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })
  const { user } = useAppStore()

  const currentUser = {
    name: user?.name || "Developer",
    email: user?.email || "dev@nuviodeck.com",
    avatar: user?.avatar || "",
  }

  const navMain = [
    {
      title: "Profiles",
      url: "/dashboard",
      icon: <Home />,
      isActive: pathname === "/dashboard",
    },
    {
      title: "Cover Studio",
      url: "/studio",
      icon: <Palette />,
      isActive: pathname === "/studio" || pathname.startsWith("/studio"),
    },
    {
      title: "Addon Manager",
      url: "/addons",
      icon: <Layers />,
      isActive: pathname === "/addons" || pathname.startsWith("/addons"),
    },
    {
      title: "Badges",
      url: "/badges",
      icon: <Tag />,
      isActive: pathname === "/badges" || pathname.startsWith("/badges"),
    },
    {
      title: "Avatars",
      url: "/avatars",
      icon: <VenetianMask />,
      isActive: pathname === "/avatars" || pathname.startsWith("/avatars"),
    },
  ]

  const navSecondary = [
    {
      title: "Settings",
      url: "/settings",
      icon: <Settings2Icon />,
    },
    {
      title: "System Status",
      url: "/status",
      icon: <Activity />,
    },
    {
      title: "What's New",
      url: "/whats-new",
      icon: <Sparkles />,
    },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="w-full border-b border-sidebar-border/50 p-3">
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-sm shadow-xs">
            N
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm leading-tight tracking-tight text-foreground truncate">
              Nuviodeck
            </span>
            <span className="text-[11px] text-muted-foreground font-medium truncate">
              Streaming Studio
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
