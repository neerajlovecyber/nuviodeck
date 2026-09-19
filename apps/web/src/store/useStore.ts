import { create } from 'zustand'

interface AppState {
  theme: 'dark' | 'light'
  user: { name: string; email: string; avatar: string } | null
  counter: number
  toggleTheme: () => void
  incrementCounter: () => void
  setUser: (user: { name: string; email: string; avatar: string } | null) => void
  setAvatar: (avatar: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  user: {
    name: 'Developer',
    email: 'dev@nuviodeck.com',
    avatar: '/avatars/nuvio/avatar_gojo_1772826847969.png',
  },
  counter: 0,
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  incrementCounter: () => set((state) => ({ counter: state.counter + 1 })),
  setUser: (user) => set({ user }),
  setAvatar: (avatar) =>
    set((state) => ({
      user: state.user ? { ...state.user, avatar } : null,
    })),
}))
