import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useBrands() {
  return useQuery<string[]>({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pieces')
        .select('brand')
        .eq('is_draft', false)
        .eq('is_available', true)
      if (error) throw error
      const brands = [...new Set((data ?? []).map(p => p.brand).filter(Boolean))].sort()
      return brands
    },
    staleTime: 10 * 60 * 1000,
  })
}
