import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Wardrobe } from '@/types'

export function useSavedWardrobes(userId: string | undefined) {
  return useQuery<Wardrobe[]>({
    queryKey: ['saved-wardrobes', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_wardrobes')
        .select('wardrobe:wardrobes(*)')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map((r: any) => r.wardrobe).filter(Boolean)
    },
    staleTime: 60_000,
  })
}

export function useIsWardrobeSaved(userId: string | undefined, wardrobeId: string) {
  return useQuery<boolean>({
    queryKey: ['wardrobe-saved', userId, wardrobeId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('saved_wardrobes')
        .select('id')
        .eq('user_id', userId!)
        .eq('wardrobe_id', wardrobeId)
        .maybeSingle()
      return !!data
    },
    staleTime: 60_000,
  })
}

export function useToggleSavedWardrobe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, wardrobeId, isSaved }: { userId: string; wardrobeId: string; isSaved: boolean }) => {
      if (isSaved) {
        await supabase.from('saved_wardrobes').delete()
          .eq('user_id', userId).eq('wardrobe_id', wardrobeId)
      } else {
        await supabase.from('saved_wardrobes').insert({ user_id: userId, wardrobe_id: wardrobeId })
      }
      return !isSaved
    },
    onSuccess: (_, { userId, wardrobeId }) => {
      queryClient.invalidateQueries({ queryKey: ['saved-wardrobes', userId] })
      queryClient.invalidateQueries({ queryKey: ['wardrobe-saved', userId, wardrobeId] })
    },
  })
}
