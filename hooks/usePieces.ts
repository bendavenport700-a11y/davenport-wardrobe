import { useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Piece, PieceCategory, PieceColor } from '@/types'

interface UsePiecesOptions {
  // Pass a single category or an array (for category group filtering)
  category?: PieceCategory | PieceCategory[] | null
  color?: PieceColor | null
  size?: string | null
  search?: string
  sortBy?: 'newest' | 'price_asc' | 'price_desc'
  availableOnly?: boolean
  wardrobeId?: string
  pageSize?: number
}

export function usePieces({ category, color, size, search, sortBy = 'newest', availableOnly = true, wardrobeId, pageSize = 20 }: UsePiecesOptions = {}) {
  return useInfiniteQuery<Piece[]>({
    queryKey: ['pieces', { category, color, size, search, sortBy, availableOnly, wardrobeId }],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase.from('pieces').select('*').eq('is_draft', false)
        .range(pageParam as number, (pageParam as number) + pageSize - 1)

      if (Array.isArray(category) && category.length > 0) {
        query = query.in('category', category)
      } else if (category && !Array.isArray(category)) {
        query = query.eq('category', category)
      }

      if (color) query = query.eq('color', color)
      if (wardrobeId) query = query.eq('wardrobe_id', wardrobeId)
      if (availableOnly) query = query.eq('is_available', true)

      // Size filter: pieces where sizes_available array contains the selected size
      if (size) query = query.contains('sizes_available', [size])

      if (search) {
        const safe = search.replace(/[(),]/g, '').trim()
        if (safe) query = query.or(`name.ilike.%${safe}%,brand.ilike.%${safe}%,description.ilike.%${safe}%`)
      }

      if (sortBy === 'newest') query = query.order('created_at', { ascending: false })
      else if (sortBy === 'price_asc') query = query.order('rental_fee', { ascending: true })
      else query = query.order('rental_fee', { ascending: false })

      const { data, error } = await query
      if (error) throw error
      return data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => lastPage.length === pageSize ? allPages.flat().length : undefined,
    staleTime: 2 * 60 * 1000,
  })
}
