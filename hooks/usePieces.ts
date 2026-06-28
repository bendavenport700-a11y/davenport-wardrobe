import { useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Piece, PieceCategory, PieceColor } from '@/types'

export type WearFilter = 'any' | 'new' | '1-5' | '6-10' | '10+'
export type SortOption = 'newest' | 'price_asc' | 'price_desc'

interface UsePiecesOptions {
  category?: PieceCategory | PieceCategory[] | null
  color?: PieceColor | null
  brand?: string | null
  tags?: string[] | null
  size?: string | null
  search?: string
  sortBy?: SortOption
  availableOnly?: boolean
  wardrobeId?: string
  pageSize?: number
  wearFilter?: WearFilter
  gender?: 'men' | 'women' | 'all' | null
  enabled?: boolean
}

export function usePieces({ category, color, brand, tags, size, search, sortBy = 'newest', availableOnly = true, wardrobeId, pageSize = 20, wearFilter = 'any', gender, enabled = true }: UsePiecesOptions = {}) {
  return useInfiniteQuery<Piece[]>({
    queryKey: ['pieces', { category, color, brand, tags, size, search, sortBy, availableOnly, wardrobeId, wearFilter, gender, pageSize }],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase.from('pieces').select('*').eq('is_draft', false)
        .range(pageParam as number, (pageParam as number) + pageSize - 1)

      if (Array.isArray(category) && category.length > 0) {
        query = query.in('category', category)
      } else if (category && !Array.isArray(category)) {
        query = query.eq('category', category)
      }

      if (color) query = query.eq('color', color)
      if (tags && tags.length > 0) query = query.contains('tags', tags)
      if (brand) {
        const safeBrand = brand.replace(/[(),]/g, '').replace(/%/g, '\\%').replace(/_/g, '\\_').trim()
        if (safeBrand) query = query.ilike('brand', `%${safeBrand}%`)
      }
      if (wardrobeId) query = query.eq('wardrobe_id', wardrobeId)
      if (availableOnly) query = query.eq('is_available', true)
      if (gender && gender !== 'all') {
        query = query.in('gender', [gender, 'unisex'])
      }

      if (wearFilter === 'new') query = query.eq('wear_count', 0)
      else if (wearFilter === '1-5') query = query.gte('wear_count', 1).lte('wear_count', 5)
      else if (wearFilter === '6-10') query = query.gte('wear_count', 6).lte('wear_count', 10)
      else if (wearFilter === '10+') query = query.gte('wear_count', 11)

      // Size filter: pieces where sizes_available array contains the selected size
      if (size) query = query.contains('sizes_available', [size])

      if (search) {
        const safe = search.replace(/[(),]/g, '').replace(/%/g, '\\%').replace(/_/g, '\\_').trim()
        if (safe) query = query.or(`name.ilike.%${safe}%,brand.ilike.%${safe}%,description.ilike.%${safe}%`)
      }

      if (sortBy === 'newest') query = query.order('created_at', { ascending: false })
      else if (sortBy === 'price_asc') query = query.order('rental_fee', { ascending: true })
      else query = query.order('rental_fee', { ascending: false })

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => lastPage.length === pageSize ? allPages.flat().length : undefined,
    staleTime: 2 * 60 * 1000,
    enabled,
  })
}
