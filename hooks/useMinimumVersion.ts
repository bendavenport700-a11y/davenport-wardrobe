import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { supabase } from '@/lib/supabase'

export function useMinimumVersion() {
  const [needsUpdate, setNeedsUpdate] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'ios') return
    const currentBuild = parseInt(
      (Constants.expoConfig?.ios?.buildNumber as string | undefined) ?? '0'
    )
    supabase
      .from('app_config')
      .select('value')
      .eq('key', 'minimum_ios_build')
      .single()
      .then(({ data }) => {
        if (!data) return
        if (currentBuild < parseInt(data.value)) setNeedsUpdate(true)
      })
  }, [])

  return needsUpdate
}
