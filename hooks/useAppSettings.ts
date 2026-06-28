import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useWomensEnabled(): boolean {
  const { data } = useQuery({
    queryKey: ['app_settings', 'womens_enabled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'womens_enabled')
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return data?.value === true
    },
    staleTime: 5 * 60 * 1000,
  })
  return data ?? false
}

export function useTripsEnabled(): boolean {
  const { data } = useQuery({
    queryKey: ['app_settings', 'trips_enabled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'trips_enabled')
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return data?.value === true
    },
    staleTime: 5 * 60 * 1000,
  })
  return data ?? false
}
