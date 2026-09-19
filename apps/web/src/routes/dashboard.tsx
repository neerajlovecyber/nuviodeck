import { createFileRoute } from '@tanstack/react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { DataTable } from '@/components/data-table'
import { SectionCards } from '@/components/section-cards'
import { SiteHeader } from '@/components/site-header'
import {
  SidebarInset,
  SidebarProvider,
} from '@workspace/ui/components/sidebar'
import dashboardData from '@/app/dashboard/data.json'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '16rem',
          '--header-height': '3.5rem',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
            <DataTable data={dashboardData} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
