import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSuitcaseStore } from '@/store/suitcaseStore'
import { useAuthStore } from '@/store/authStore'
import type { Profile, Piece } from '@/types'

export function useProfile(userId: string | undefined) {
  return useQuery<Profile>({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId!).single()
      if (error) throw error
      return data
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<Pick<Profile, 'full_name' | 'phone' | 'shipping_address' | 'terms_accepted_at' | 'gender_preference'>> }) => {
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', data.id], data)
      useAuthStore.getState().setProfile(data)
    },
  })
}

export function useSyncServerSuitcase(userId: string | undefined) {
  const { addItem } = useSuitcaseStore()
  const hasHydrated = useSuitcaseStore(s => s._hasHydrated)

  useEffect(() => {
    // Wait for AsyncStorage hydration to complete before adding server items.
    // If we call addItem() before hydration finishes, the incoming AsyncStorage
    // state will overwrite the server items when the store rehydrates.
    if (!userId || !hasHydrated) return
    supabase
      .from('suitcase_items')
      .select('*, piece:pieces(*)')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (error) { console.error('Failed to sync server suitcase:', error.message); return }
        data?.forEach(row => {
          if (row.piece) addItem(row.piece as Piece, row.size, { preferWorn: row.prefer_worn ?? false })
        })
      })
  }, [userId, addItem, hasHydrated])
}
