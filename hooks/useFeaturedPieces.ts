import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Piece } from '@/types'

export function useFeaturedPieces() {
  return useQuery<Piece[]>({
    queryKey: ['pieces', 'featured'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pieces').select('*')
        .eq('is_featured', true).eq('is_draft', false).eq('is_available', true).limit(6)
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}
