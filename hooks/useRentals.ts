import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Rental } from '@/types'

export function useActiveRentals(userId: string | undefined) {
  return useQuery<Rental[]>({
    queryKey: ['rentals', 'active', userId],
    enabled: !!userId,
    queryFn: async () => {
      // Include return_requested alongside active billing so customers can see
      // in-progress returns. Bought-out and returned are excluded (terminal states).
      const { data, error } = await supabase.from('rentals').select('*, piece:pieces(*)')
        .eq('user_id', userId!)
        .in('status', ['pending', 'sourcing', 'packaged', 'shipped', 'delivered', 'return_requested'])
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    staleTime: 30_000,
  })
}

export function useOrderRentals(rentalIds: string[] | undefined) {
  return useQuery<Rental[]>({
    queryKey: ['rentals', 'order', rentalIds],
    enabled: !!rentalIds && rentalIds.length > 0,
    queryFn: async () => {
      if (!rentalIds?.length) return []
      const { data, error } = await supabase.from('rentals').select('*, piece:pieces(*)')
        .in('id', rentalIds)
      if (error) throw error
      return data ?? []
    },
    staleTime: 30 * 1000,
  })
}
