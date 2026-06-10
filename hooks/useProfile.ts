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
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<Pick<Profile, 'full_name' | 'phone' | 'shipping_address' | 'terms_accepted_at'>> }) => {
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

  useEffect(() => {
    if (!userId) return
    // Pull server items and merge into local store.
    // addItem is idempotent (deduplicates by piece+size), so this is safe even if
    // local already has items — it only adds things that aren't there yet.
    supabase
      .from('suitcase_items')
      .select('*, piece:pieces(*)')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (error) { console.error('Failed to sync server suitcase:', error.message); return }
        data?.forEach(row => {
          if (row.piece) addItem(row.piece as Piece, row.size)
        })
      })
  }, [userId, addItem])
}
