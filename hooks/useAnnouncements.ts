import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Announcement } from '@/types'

export function useAnnouncements() {
  return useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('active', true)
        .order('sort_order')
      if (error) throw error
      return data
    },
    staleTime: 5 * 60_000,
  })
}
