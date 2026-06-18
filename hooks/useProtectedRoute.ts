import { useEffect, useRef } from 'react'
import { useRouter, useSegments } from 'expo-router'
import { useAuthStore } from '@/store/authStore'

export function useProtectedRoute() {
  const { session, profile, hydrated } = useAuthStore()
  const segments = useSegments()
  const router = useRouter()
  const profileTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!hydrated) return
    const inAuthGroup = segments[0] === '(auth)'
    const isGuestOk =
      segments[0] === '(tabs)'        ||
      segments[0] === 'piece'         ||
      segments[0] === 'wardrobe'      ||
      segments[0] === 'faq'           ||
      segments[0] === 'rental-terms'  ||
      segments[0] === 'privacy'       ||
      segments[0] === 'reset-password'

    if (!session && !inAuthGroup && !isGuestOk) {
      router.replace('/(auth)/login')
      return
    }

    if (session && inAuthGroup) {
      if (!profile) {
        // Profile is still loading. Start a 5-second timeout so that if the fetch
        // fails silently (network error) the user isn't permanently stuck on the
        // auth screen — they'll land in tabs where individual screens can retry.
        if (!profileTimeoutRef.current) {
          profileTimeoutRef.current = setTimeout(() => {
            profileTimeoutRef.current = null
            const currentProfile = useAuthStore.getState().profile
            if (!currentProfile) {
              router.replace('/(tabs)')
            }
          }, 5000)
        }
        return
      }
      // Profile loaded — cancel any pending timeout
      if (profileTimeoutRef.current) {
        clearTimeout(profileTimeoutRef.current)
        profileTimeoutRef.current = null
      }
      if (!profile.terms_accepted_at || !profile.shipping_address) {
        if (segments[1] !== 'complete-profile') {
          router.replace('/(auth)/complete-profile')
        }
      } else {
        router.replace('/(tabs)')
      }
    } else {
      // Not in auth group — cancel any pending timeout
      if (profileTimeoutRef.current) {
        clearTimeout(profileTimeoutRef.current)
        profileTimeoutRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, profile, hydrated])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current)
    }
  }, [])
}
