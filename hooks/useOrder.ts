import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Order } from '@/types'

export function useOrder(id: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!id || id === 'processing') return
    const channel = supabase.channel(`order-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        () => queryClient.invalidateQueries({ queryKey: ['order', id] }))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id, queryClient])

  return useQuery<Order>({
    queryKey: ['order', id],
    enabled: !!id && id !== 'processing',
    queryFn: async () => {
      // Two-step: fetch order first, then load rentals by rental_ids array
      // (rentals table has no order_id FK — relationship is stored as rental_ids[] on orders)
      const { data: order, error } = await supabase
        .from('orders').select('*').eq('id', id!).single()
      if (error) throw error

      if (order.rental_ids?.length) {
        const { data: rentals } = await supabase
          .from('rentals')
          .select('*, piece:pieces(*)')
          .in('id', order.rental_ids)
        return { ...order, rentals: rentals ?? [] }
      }

      return { ...order, rentals: [] }
    },
  })
}
