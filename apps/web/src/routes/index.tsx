import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppStore } from '../store/useStore'
import { Button } from '@workspace/ui/components/button'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

const newUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
})

type NewUserForm = z.infer<typeof newUserSchema>

function IndexPage() {
  const queryClient = useQueryClient()
  const { user, counter, incrementCounter } = useAppStore()

  // TanStack Query fetching from Hono backend API
  const { data: healthData, isLoading: isHealthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3001/api/health')
      if (!res.ok) throw new Error('Health check failed')
      return res.json()
    },
  })

  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3001/api/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    },
  })

  // Mutation to add a user via Hono API
  const createUserMutation = useMutation({
    mutationFn: async (newUser: NewUserForm) => {
      const res = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })
      if (!res.ok) throw new Error('Failed to create user')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      reset()
    },
  })

  // React Hook Form + Zod
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewUserForm>({
    resolver: zodResolver(newUserSchema),
  })

  const onSubmit = (data: NewUserForm) => {
    createUserMutation.mutate(data)
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuviodeck Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Powered by React 19, TanStack Router, TanStack Query, Zustand & Hono with Drizzle ORM.
        </p>
      </div>

      {/* Grid Status Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Hono Backend Status Card */}
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-xs">
          <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">Hono API Status</h2>
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full ${
                healthData?.status === 'ok' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="font-bold text-lg">
              {isHealthLoading ? 'Connecting...' : healthData?.status === 'ok' ? 'Online' : 'Offline'}
            </span>
          </div>
          {healthData?.timestamp && (
            <p className="text-xs text-muted-foreground mt-2">
              Last Ping: {new Date(healthData.timestamp).toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Zustand Client State Card */}
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-xs">
          <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">Zustand State</h2>
          <p className="mt-2 text-2xl font-bold">Clicks: {counter}</p>
          <Button size="sm" className="mt-3" onClick={incrementCounter}>
            Increment Counter
          </Button>
        </div>

        {/* User Info Card */}
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-xs">
          <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">Active Session</h2>
          <p className="mt-2 font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Drizzle DB Users List & Add User Form */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Drizzle DB Users Table */}
        <div className="p-6 rounded-xl border bg-card shadow-xs space-y-4">
          <h3 className="font-semibold text-lg">Drizzle Database Users</h3>
          {isUsersLoading ? (
            <p className="text-muted-foreground text-sm">Loading users from SQLite...</p>
          ) : usersData?.users?.length === 0 ? (
            <p className="text-muted-foreground text-sm">No users found. Create one using the form!</p>
          ) : (
            <ul className="divide-y border rounded-lg overflow-hidden">
              {usersData?.users?.map((u: { id: number; name: string; email: string; createdAt: string }) => (
                <li key={u.id} className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium text-sm">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-1 rounded-full font-mono">
                    ID #{u.id}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* React Hook Form + Zod Form */}
        <div className="p-6 rounded-xl border bg-card shadow-xs space-y-4">
          <h3 className="font-semibold text-lg">Add New User</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">Name</label>
              <input
                {...register('name')}
                placeholder="Jane Doe"
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Email</label>
              <input
                {...register('email')}
                placeholder="jane@example.com"
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>

            <Button type="submit" disabled={createUserMutation.isPending} className="w-full">
              {createUserMutation.isPending ? 'Adding...' : 'Add User to Drizzle DB'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
