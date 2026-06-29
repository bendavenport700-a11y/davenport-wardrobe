import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Piece } from '@/types'

export function useReadyToOwn(limit = 10) {
  return useQuery<Piece[]>({
    queryKey: ['pieces', 'ready-to-own', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pieces')
        .select('*')
        .gte('wear_count', 7)
        .eq('is_draft', false)
        .eq('is_available', true)
        .order('wear_count', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}
