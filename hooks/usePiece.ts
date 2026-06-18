import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Piece } from '@/types'

export interface PieceUnit {
  id: string
  size: string
  wear_count: number
  condition: 'new' | 'like_new' | 'good'
  is_available: boolean
}

export interface PieceWithUnits extends Piece {
  availableUnits: PieceUnit[]
}

export function usePiece(id: string | undefined) {
  return useQuery<PieceWithUnits>({
    queryKey: ['piece', id],
    enabled: !!id,
    queryFn: async () => {
      const [pieceRes, unitsRes] = await Promise.all([
        supabase.from('pieces').select('*').eq('id', id!).eq('is_draft', false).single(),
        supabase
          .from('piece_units')
          .select('id, size, wear_count, condition, is_available')
          .eq('piece_id', id!)
          .eq('is_available', true)
          .order('wear_count', { ascending: true }),
      ])
      if (pieceRes.error) throw pieceRes.error
      if (unitsRes.error) throw unitsRes.error
      return { ...pieceRes.data, availableUnits: unitsRes.data ?? [] }
    },
    staleTime: 2 * 60 * 1000,
  })
}
