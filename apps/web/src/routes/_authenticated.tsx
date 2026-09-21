import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AuthGuard } from '@/components/auth-guard'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <AuthGuard>
      <Outlet />
    </AuthGuard>
  )
}
