import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Trip, TripItem } from '@/types'

export interface TripWithItems extends Trip {
  items: TripItem[]
}

export function useTrip(tripId: string | undefined) {
  return useQuery<TripWithItems>({
    queryKey: ['trip', tripId],
    enabled: !!tripId,
    queryFn: async () => {
      const [tripRes, itemsRes] = await Promise.all([
        supabase.from('trips').select('*').eq('id', tripId!).single(),
        supabase
          .from('trip_items')
          .select('*, piece:pieces(*)')
          .eq('trip_id', tripId!)
          .order('sort_order', { ascending: true }),
      ])
      if (tripRes.error) throw tripRes.error
      if (itemsRes.error) throw itemsRes.error
      return { ...tripRes.data, items: itemsRes.data ?? [] } as TripWithItems
    },
    staleTime: 30_000,
  })
}

interface AddTripItemInput {
  trip_id: string
  piece_id: string
  size?: string | null
  occasion?: string | null
  notes?: string | null
  sort_order?: number
}

export function useAddTripItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AddTripItemInput) => {
      const { data, error } = await supabase
        .from('trip_items')
        .insert(input)
        .select('*, piece:pieces(*)')
        .single()
      if (error) throw error
      return data as TripItem
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trip', variables.trip_id] })
    },
  })
}

interface UpdateTripItemInput {
  id: string
  trip_id: string
  size?: string | null
  occasion?: string | null
  notes?: string | null
  sort_order?: number
}

export function useUpdateTripItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, trip_id, ...updates }: UpdateTripItemInput) => {
      const { data, error } = await supabase
        .from('trip_items')
        .update(updates)
        .eq('id', id)
        .select('*, piece:pieces(*)')
        .single()
      if (error) throw error
      return data as TripItem
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trip', variables.trip_id] })
    },
  })
}

export function useRemoveTripItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, trip_id }: { id: string; trip_id: string }) => {
      const { error } = await supabase.from('trip_items').delete().eq('id', id)
      if (error) throw error
      return { id, trip_id }
    },
    onSuccess: ({ trip_id }) => {
      queryClient.invalidateQueries({ queryKey: ['trip', trip_id] })
    },
  })
}
