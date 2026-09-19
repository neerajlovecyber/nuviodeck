import { createFileRoute, Link } from '@tanstack/react-router'
import { buttonVariants } from '@workspace/ui/components/button'
import { Badge } from '@workspace/ui/components/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@workspace/ui/components/card'
import {
  ArrowRight,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Zap,
} from 'lucide-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 max-w-5xl mx-auto space-y-16">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center space-y-6">
        <Badge variant="secondary" className="px-3 py-1 text-xs gap-1.5 rounded-full">
          <Sparkles className="size-3.5 text-primary" />
          <span>Nuviodeck Workspace</span>
        </Badge>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl">
          A powerful modern dashboard for your business operations
        </h1>

        <p className="text-muted-foreground text-lg max-w-2xl">
          Real-time analytics, interactive data tables, metrics, and workflow controls built with shadcn/ui and React 19.
        </p>

        <div className="flex items-center gap-4 pt-2">
          <Link
            to="/dashboard"
            className={buttonVariants({
              size: 'lg',
              className: 'rounded-xl px-8 h-12 text-base font-semibold shadow-sm',
            })}
          >
            Open App
            <ArrowRight className="size-4 ml-2" />
          </Link>

          <Link
            to="/settings"
            className={buttonVariants({
              variant: 'outline',
              size: 'lg',
              className: 'rounded-xl px-6 h-12 text-base',
            })}
          >
            Settings
          </Link>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="grid gap-6 md:grid-cols-3 w-full">
        <Card className="rounded-xl shadow-xs">
          <CardHeader>
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
              <BarChart3 className="size-5" />
            </div>
            <CardTitle className="text-lg">Interactive Analytics</CardTitle>
            <CardDescription>
              Real-time area charts and performance metrics visualizing your workspace data.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="rounded-xl shadow-xs">
          <CardHeader>
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
              <Zap className="size-5" />
            </div>
            <CardTitle className="text-lg">Draggable Data Table</CardTitle>
            <CardDescription>
              Filter, sort, reorder rows, and inspect records with drawer previews.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="rounded-xl shadow-xs">
          <CardHeader>
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
              <ShieldCheck className="size-5" />
            </div>
            <CardTitle className="text-lg">Full Operational Control</CardTitle>
            <CardDescription>
              Manage documents, lifecycle streams, and team settings from a unified sidebar.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      {/* Quick Launch Banner */}
      <section className="w-full rounded-2xl border bg-card p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
        <div>
          <h3 className="text-xl font-bold">Ready to see it in action?</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Explore the complete Dashboard 01 workspace with interactive charts and tables.
          </p>
        </div>
        <Link
          to="/dashboard"
          className={buttonVariants({
            size: 'default',
            className: 'rounded-lg font-semibold shrink-0',
          })}
        >
          Open App
          <ArrowRight className="size-4 ml-1.5" />
        </Link>
      </section>
    </div>
  )
}
