import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Trip, TripType, TripClimate } from '@/types'

export type TripWithCount = Trip & { item_count: number }

export function useTrips(userId: string | undefined) {
  return useQuery<TripWithCount[]>({
    queryKey: ['trips', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*, trip_items(count)')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map((t: any) => ({
        ...t,
        item_count: t.trip_items?.[0]?.count ?? 0,
      }))
    },
    staleTime: 60_000,
  })
}

interface CreateTripInput {
  user_id: string
  name: string
  type: TripType
  start_date?: string | null
  end_date?: string | null
  destination?: string | null
  climate?: TripClimate | null
  occasions?: string[] | null
  notes?: string | null
}

export function useCreateTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateTripInput) => {
      const { data, error } = await supabase
        .from('trips')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as Trip
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trips', data.user_id] })
    },
  })
}

interface UpdateTripInput {
  id: string
  user_id: string
  name?: string
  type?: TripType
  start_date?: string | null
  end_date?: string | null
  destination?: string | null
  climate?: TripClimate | null
  occasions?: string[] | null
  notes?: string | null
  status?: Trip['status']
}

export function useUpdateTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, user_id, ...updates }: UpdateTripInput) => {
      const { data, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Trip
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trips', data.user_id] })
      queryClient.invalidateQueries({ queryKey: ['trip', data.id] })
    },
  })
}

export function useDeleteTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase.from('trips').delete().eq('id', id)
      if (error) throw error
      return { id, userId }
    },
    onSuccess: ({ id, userId }) => {
      queryClient.invalidateQueries({ queryKey: ['trips', userId] })
      queryClient.invalidateQueries({ queryKey: ['trip', id] })
    },
  })
}
