import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Wardrobe } from '@/types'

export function useWardrobes() {
  return useQuery<Wardrobe[]>({
    queryKey: ['wardrobes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('wardrobes').select('*').eq('is_active', true).order('sort_order')
      if (error) throw error
      return data
    },
    staleTime: 60_000,
  })
}
