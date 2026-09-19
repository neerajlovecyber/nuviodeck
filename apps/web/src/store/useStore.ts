import { create } from 'zustand'

interface AppState {
  theme: 'dark' | 'light'
  user: { name: string; email: string } | null
  counter: number
  toggleTheme: () => void
  incrementCounter: () => void
  setUser: (user: { name: string; email: string } | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  user: { name: 'Developer', email: 'dev@nuviodeck.com' },
  counter: 0,
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  incrementCounter: () => set((state) => ({ counter: state.counter + 1 })),
  setUser: (user) => set({ user }),
}))
