"use client"

import * as React from "react"
import {
  ChevronsUpDown,
  Plus,
  Tv,
  User,
  Loader2,
  LogIn,
  UserPlus,
  Check,
  Sparkles,
  LogOut,
  MoreHorizontal,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@workspace/ui/components/tabs"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { useAppStore } from "@/store/useStore"
import { toast } from "sonner"

export interface ConnectedAccount {
  id: string
  name: string
  email: string
  plan: string
}

export function TeamSwitcher({
  initialAccounts,
}: {
  initialAccounts?: ConnectedAccount[]
}) {
  const { isMobile } = useSidebar()
  const { setUser } = useAppStore()

  const [accounts, setAccounts] = React.useState<ConnectedAccount[]>(
    initialAccounts || []
  )

  const [activeAccount, setActiveAccount] = React.useState<ConnectedAccount | null>(
    accounts[0] || null
  )

  // Dialog state for adding a new Nuvio account
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"login" | "signup">("login")

  // Login form state
  const [loginEmail, setLoginEmail] = React.useState("")
  const [loginPassword, setLoginPassword] = React.useState("")

  // Signup form state
  const [signupEmail, setSignupEmail] = React.useState("")
  const [signupPassword, setSignupPassword] = React.useState("")
  const [signupConfirm, setSignupConfirm] = React.useState("")

  const [isLoading, setIsLoading] = React.useState(false)

  // Load connected accounts from backend
  const refreshAccounts = React.useCallback(async () => {
    try {
      const res = await fetch("/api/nuvio/auth/sessions")
      if (res.ok) {
        const data = await res.json()
        const rawSessions: any[] = Array.isArray(data.sessions) ? data.sessions : []

        const mapped: ConnectedAccount[] = rawSessions.map((s: any) => ({
          id: s.id,
          name: (s.email?.split("@")[0] || "USER").toUpperCase(),
          email: s.email,
          plan: `Profile ${s.activeProfileIndex || 1} Active`,
        }))

        setAccounts(mapped)

        setActiveAccount((curr) => {
          if (curr && mapped.some((a) => a.id === curr.id)) {
            return mapped.find((a) => a.id === curr.id) || mapped[0] || null
          }
          const next = mapped[0] || null
          if (next) {
            setUser({
              name: next.name,
              email: next.email,
              avatar: "/avatars/nuvio/avatar_gojo_1772826847969.png",
            })
          } else {
            setUser(null)
          }
          return next
        })
      }
    } catch {
      // Offline / fallback
    }
  }, [setUser])

  React.useEffect(() => {
    refreshAccounts()
  }, [refreshAccounts])

  // Handle switching accounts
  const handleSelectAccount = async (account: ConnectedAccount) => {
    setActiveAccount(account)
    setUser({
      name: account.name,
      email: account.email,
      avatar: "/avatars/nuvio/avatar_gojo_1772826847969.png",
    })

    try {
      await fetch(`/api/nuvio/auth/sessions/${account.id}/select`, {
        method: "POST",
      })
      toast.success(`Switched to Nuvio account: ${account.email}`)
    } catch {
      toast.success(`Active account set to ${account.email}`)
    }
  }

  // Handle disconnecting / removing an account
  const handleDisconnectAccount = async (accountId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()

    // Optimistically update UI immediately
    setAccounts((prev) => {
      const remaining = prev.filter((a) => a.id !== accountId)
      setActiveAccount((curr) => {
        if (curr?.id === accountId) {
          const next = remaining[0] || null
          if (next) {
            setUser({
              name: next.name,
              email: next.email,
              avatar: "/avatars/nuvio/avatar_gojo_1772826847969.png",
            })
          } else {
            setUser(null)
          }
          return next
        }
        return curr
      })
      return remaining
    })

    try {
      const res = await fetch(`/api/nuvio/auth/sessions/${accountId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        throw new Error("Failed to delete from server")
      }
      toast.success("Account disconnected")
      await refreshAccounts()
    } catch (err: any) {
      toast.error(err.message || "Failed to disconnect account")
    }
  }

  // Handle Sign In
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      toast.error("Please enter both email and password")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/nuvio/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword, saveSession: true }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to authenticate with Nuvio")
      }

      toast.success(`Connected Nuvio account: ${loginEmail}`)
      setIsAddOpen(false)
      setLoginEmail("")
      setLoginPassword("")

      await refreshAccounts()
    } catch (err: any) {
      toast.error(err.message || "Failed to connect account")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Sign Up (Create Account)
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signupEmail || !signupPassword) {
      toast.error("Please enter email and password")
      return
    }

    if (signupPassword !== signupConfirm) {
      toast.error("Passwords do not match")
      return
    }

    if (signupPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/nuvio/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signupEmail, password: signupPassword, saveSession: true }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to create Nuvio account")
      }

      toast.success(`Created & connected Nuvio account: ${signupEmail}`)
      setIsAddOpen(false)
      setSignupEmail("")
      setSignupPassword("")
      setSignupConfirm("")

      await refreshAccounts()
    } catch (err: any) {
      toast.error(err.message || "Failed to create account")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <SidebarMenu className="w-full">
        <SidebarMenuItem className="w-full">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="w-full flex items-center justify-between data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs shrink-0">
                  {activeAccount ? <Tv className="size-4" /> : <LogIn className="size-4" />}
                </div>
                <div className="grid flex-1 min-w-0 text-left text-sm leading-tight ml-2">
                  <span className="truncate font-semibold">
                    {activeAccount ? activeAccount.name : "Nuviodeck"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {activeAccount ? activeAccount.email : "Connect Nuvio Account"}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground shrink-0" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--anchor-width) min-w-[240px] rounded-xl p-1.5 shadow-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase px-2 py-1.5">
                {accounts.length > 0 ? "Connected Accounts" : "Nuvio Integration"}
              </DropdownMenuLabel>

              {accounts.map((acc) => {
                const isSelected = activeAccount && acc.id === activeAccount.id
                return (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between gap-1 p-1 rounded-lg hover:bg-muted/50 group transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectAccount(acc)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left px-1.5 py-1 rounded-md hover:bg-accent/40 transition-colors"
                    >
                      <div className="flex size-7 items-center justify-center rounded-md border bg-muted/40 shrink-0">
                        <User className="size-3.5 text-foreground/80" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-medium text-foreground truncate">
                          {acc.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {acc.email}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="size-3.5 text-primary shrink-0 mr-1" />
                      )}
                    </button>

                    {/* 3 Dots Menu for this specific account */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-70 group-hover:opacity-100 shrink-0"
                          title="Account options"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="size-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        side="right"
                        className="min-w-36 p-1 rounded-xl shadow-lg"
                      >
                        <DropdownMenuItem
                          onClick={() => handleDisconnectAccount(acc.id)}
                          className="text-destructive focus:text-destructive gap-2 text-xs cursor-pointer p-1.5 rounded-lg"
                        >
                          <LogOut className="size-3.5" />
                          <span>Disconnect</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}

              {accounts.length > 0 && <DropdownMenuSeparator className="my-1.5" />}

              <DropdownMenuItem
                onClick={() => {
                  setActiveTab("login")
                  setIsAddOpen(true)
                }}
                className="gap-2.5 p-2 rounded-lg cursor-pointer text-primary focus:text-primary font-medium"
              >
                <div className="flex size-7 items-center justify-center rounded-md border border-dashed border-primary/50 bg-primary/5 shrink-0">
                  <Plus className="size-4" />
                </div>
                <span className="text-xs">Connect Nuvio Account</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Connect / Create Account Modal with Tabs on Top */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as "login" | "signup")}
            className="w-full"
          >
            {/* Tabs List on Top */}
            <div className="pt-1 pb-2">
              <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/70 rounded-xl h-10">
                <TabsTrigger
                  value="login"
                  className="rounded-lg text-xs font-medium gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs"
                >
                  <LogIn className="size-3.5" />
                  <span>Sign In</span>
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-lg text-xs font-medium gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs"
                >
                  <UserPlus className="size-3.5" />
                  <span>Create Account</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: Sign In */}
            <TabsContent value="login" className="space-y-4 pt-1">
              <DialogHeader className="text-left space-y-1">
                <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                  <LogIn className="size-4 text-primary" />
                  <span>Connect Nuvio Account</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                  Sign in with your existing Nuvio credentials to manage profiles, sync collections,
                  and push custom badge packs.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleLogin} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-xs font-medium">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="user@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="text-xs font-medium">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-9 text-xs"
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={isLoading} className="w-full h-9 text-xs gap-1.5 font-medium shadow-xs">
                    {isLoading && <Loader2 className="size-3.5 animate-spin" />}
                    <span>Sign In & Connect</span>
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            {/* TAB 2: Create Account (Sign Up) */}
            <TabsContent value="signup" className="space-y-4 pt-1">
              <DialogHeader className="text-left space-y-1">
                <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  <span>Create Nuvio Account</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                  Register a new Nuvio account. Default integrations will be provisioned
                  automatically by Nuvio.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSignup} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-xs font-medium">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="newuser@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-xs font-medium">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-confirm" className="text-xs font-medium">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="Re-enter password"
                    value={signupConfirm}
                    onChange={(e) => setSignupConfirm(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-9 text-xs"
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={isLoading} className="w-full h-9 text-xs gap-1.5 font-medium shadow-xs bg-primary text-primary-foreground">
                    {isLoading && <Loader2 className="size-3.5 animate-spin" />}
                    <span>Create & Connect</span>
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
