import { create } from 'zustand'
import { nuvioApi } from '@/lib/nuvio-api'

import rawAvatars from '@/data/avatars.json'

export interface UserProfile {
  name: string
  email: string
  avatar: string
}

interface AppState {
  theme: 'dark' | 'light'
  user: UserProfile | null
  isLoadingSession: boolean
  counter: number
  toggleTheme: () => void
  incrementCounter: () => void
  setUser: (user: UserProfile | null) => void
  setAvatar: (avatar: string) => void
  checkSession: () => Promise<UserProfile | null>
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: 'light',
  user: null,
  isLoadingSession: true,
  counter: 0,
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  incrementCounter: () => set((state) => ({ counter: state.counter + 1 })),
  setUser: (user) => set({ user }),
  setAvatar: (avatar) =>
    set((state) => ({
      user: state.user ? { ...state.user, avatar } : null,
    })),
  checkSession: async () => {
    set({ isLoadingSession: true })
    try {
      const res = await nuvioApi.getSession()
      if (res.session && !res.session.isExpired) {
        const email = res.session.email || 'User'
        const defaultName = email.split('@')[0]
        let name = defaultName.charAt(0).toUpperCase() + defaultName.slice(1)
        let avatar = '/avatars/nuvio/avatar_gojo_1772826847969.png'

        try {
          // Fetch live profiles from connected Nuvio account
          const profilesRes = await nuvioApi.getProfiles()
          // In Nuvio, profile_index 1 is the primary account profile
          const primaryProfile =
            profilesRes.profiles?.find((p) => p.profile_index === 1) ||
            profilesRes.profiles?.[0]

          if (primaryProfile) {
            if (primaryProfile.name) {
              name = primaryProfile.name
            }
            if (primaryProfile.avatar_url) {
              avatar = primaryProfile.avatar_url
            } else if (primaryProfile.avatar_id) {
              const matched = (rawAvatars as any[]).find(
                (a) => a.id === primaryProfile.avatar_id
              )
              if (matched?.remoteUrl || matched?.localUrl) {
                avatar = matched.remoteUrl || matched.localUrl
              }
            }
          }
        } catch (err) {
          console.warn('Could not fetch primary profile avatar from Nuvio:', err)
        }

        const user: UserProfile = {
          name,
          email,
          avatar,
        }
        set({ user, isLoadingSession: false })
        return user
      } else {
        set({ user: null, isLoadingSession: false })
        return null
      }
    } catch {
      set({ user: null, isLoadingSession: false })
      return null
    }
  },
}))
