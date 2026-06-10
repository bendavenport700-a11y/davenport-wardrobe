import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Piece } from '@/types'

export function usePiece(id: string | undefined) {
  return useQuery<Piece>({
    queryKey: ['piece', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('pieces').select('*').eq('id', id!).eq('is_draft', false).single()
      if (error) throw error
      return data
    },
    staleTime: 2 * 60 * 1000,
  })
}
