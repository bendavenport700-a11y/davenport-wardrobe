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
        const minimumBuild = parseInt(data.value, 10)
        if (!isNaN(minimumBuild) && currentBuild < minimumBuild) setNeedsUpdate(true)
      })
      .catch(e => console.error('Version check failed (non-fatal):', e))
  }, [])

  return needsUpdate
}
