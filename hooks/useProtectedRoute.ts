import { useEffect } from 'react'
import { useRouter, useSegments } from 'expo-router'
import { useAuthStore } from '@/store/authStore'

export function useProtectedRoute() {
  const { session, profile } = useAuthStore()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)'
    // rental-terms and privacy modals must be accessible before signup
    const isPublicModal = segments[0] === 'rental-terms' || segments[0] === 'privacy'
    if (!session && !inAuthGroup && !isPublicModal) {
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      // Wait for profile to load before redirecting — avoids flash to complete-profile
      // while profile is still being fetched after login
      if (!profile) return
      if (!profile.terms_accepted_at || !profile.shipping_address) {
        router.replace('/(auth)/complete-profile')
      } else {
        router.replace('/(tabs)')
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, profile])
}
