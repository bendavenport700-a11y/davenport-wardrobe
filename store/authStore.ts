import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import type { Profile } from '@/types'

interface AuthStore {
  session: Session | null
  profile: Profile | null
  setSession: (s: Session | null) => void
  setProfile: (p: Profile | null) => void
  isAdmin: () => boolean
  hasCompletedProfile: () => boolean
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  profile: null,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  isAdmin: () => get().profile?.is_admin ?? false,
  hasCompletedProfile: () => {
    const p = get().profile
    return !!(p?.full_name && p?.shipping_address && p?.terms_accepted_at)
  },
}))
