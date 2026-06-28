import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Review {
  id: string
  piece_id: string
  rental_id: string
  user_id: string
  rating: number
  body: string | null
  created_at: string
}

export interface PendingReview {
  rental_id: string
  piece_id: string
  piece_name: string
  piece_brand: string
  piece_image: string | null
}

/** All reviews for a piece — readable by anyone */
export function usePieceReviews(pieceId: string) {
  return useQuery<Review[]>({
    queryKey: ['reviews', pieceId],
    enabled: !!pieceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('piece_id', pieceId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 5 * 60_000,
  })
}

/** Returned rentals that the user hasn't reviewed yet */
export function usePendingReviews(userId: string | undefined) {
  return useQuery<PendingReview[]>({
    queryKey: ['pending-reviews', userId],
    enabled: !!userId,
    queryFn: async () => {
      const [{ data: rentals, error: rentalsError }, { data: reviewed, error: reviewedError }] = await Promise.all([
        supabase
          .from('rentals')
          .select('id, piece_id, piece:pieces(name, brand, images)')
          .eq('user_id', userId!)
          .eq('status', 'returned'),
        supabase
          .from('reviews')
          .select('rental_id')
          .eq('user_id', userId!),
      ])
      if (rentalsError) throw rentalsError
      if (reviewedError) throw reviewedError

      const reviewedIds = new Set((reviewed ?? []).map(r => r.rental_id))

      return (rentals ?? [])
        .filter(r => !reviewedIds.has(r.id))
        .map(r => {
          const raw = r.piece
          const p = (Array.isArray(raw) ? raw[0] : raw) as { name: string; brand: string; images: string[] } | null
          return {
            rental_id:   r.id,
            piece_id:    r.piece_id,
            piece_name:  p?.name  ?? '',
            piece_brand: p?.brand ?? '',
            piece_image: p?.images?.[0] ?? null,
          }
        })
    },
    staleTime: 2 * 60_000,
  })
}

/** Submit a review */
export function useSubmitReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      rental_id: string
      piece_id: string
      user_id: string
      rating: number
      body?: string
    }) => {
      const { error } = await supabase.from('reviews').insert(input)
      if (error) throw error
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ['reviews', input.piece_id] })
      qc.invalidateQueries({ queryKey: ['pending-reviews', input.user_id] })
    },
  })
}
