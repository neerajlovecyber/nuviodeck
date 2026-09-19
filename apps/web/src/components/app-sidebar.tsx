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
  CommandIcon,
  Home,
  Wand2,
  Tag,
  VenetianMask,
} from "lucide-react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })
  const { user } = useAppStore()

  const currentUser = {
    name: user?.name || "Developer",
    email: user?.email || "dev@nuviodeck.com",
    avatar: user?.avatar || "/avatars/nuvio/avatar_gojo_1772826847969.png",
  }

  const navMain = [
    {
      title: "Profiles",
      url: "/dashboard",
      icon: <Home />,
      isActive: pathname === "/dashboard",
    },
    {
      title: "Wizard",
      url: "/dashboard",
      icon: <Wand2 />,
      isActive: false,
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
      title: "Get Help",
      url: "/dashboard",
      icon: <CircleHelpIcon />,
    },
    {
      title: "Search",
      url: "/avatars",
      icon: <SearchIcon />,
    },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/dashboard" />}
            >
              <CommandIcon className="size-5!" />
              <span className="text-base font-semibold">Nuviodeck</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
