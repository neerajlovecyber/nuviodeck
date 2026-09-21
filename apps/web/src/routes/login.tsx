import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { LoginForm } from '@/components/login-form'
import { useAppStore } from '@/store/useStore'
import { useEffect } from 'react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const user = useAppStore((s) => s.user)
  const isLoadingSession = useAppStore((s) => s.isLoadingSession)
  const navigate = useNavigate()

  useEffect(() => {
    if (user && !isLoadingSession) {
      navigate({ to: '/dashboard' })
    }
  }, [user, isLoadingSession, navigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm />
      </div>
    </div>
  )
}
