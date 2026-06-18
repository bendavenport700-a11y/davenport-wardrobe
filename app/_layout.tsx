import { useEffect } from 'react'
import { Linking } from 'react-native'
import { Stack, router } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import { useSyncServerSuitcase } from '@/hooks/useProfile'
import { useMinimumVersion } from '@/hooks/useMinimumVersion'
import { useSuitcaseStore } from '@/store/suitcaseStore'
import { StripeWrapper } from '@/lib/StripeWrapper'
import { ForceUpdateModal } from '@/components/ui/ForceUpdateModal'

SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 2, staleTime: 60_000 } } })

function NavigationGuard() {
  useProtectedRoute()
  useSyncServerSuitcase(useAuthStore(s => s.session)?.user.id)
  const needsUpdate = useMinimumVersion()
  return <ForceUpdateModal visible={needsUpdate} />
}

export default function RootLayout() {
  const { setSession, setProfile, setHydrated } = useAuthStore()

  const [fontsLoaded, fontError] = useFonts({
    'PlayfairDisplay-Bold': require('@/assets/fonts/PlayfairDisplay-Bold.ttf'),
    'Inter-Regular': require('@/assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('@/assets/fonts/Inter-Medium.ttf'),
    'Inter-Bold': require('@/assets/fonts/Inter-Bold.ttf'),
  })

  useEffect(() => {
    if (fontError) console.error('Font load error:', fontError)
    if (fontsLoaded || fontError) SplashScreen.hideAsync()
  }, [fontsLoaded, fontError])

  useEffect(() => {
    // Track the last UID we fetched a profile for to avoid duplicate fetches when
    // both getSession() and onAuthStateChange fire with the same session on cold start.
    let lastFetchedUid: string | null = null

    const fetchProfile = async (uid: string) => {
      if (lastFetchedUid === uid) return
      lastFetchedUid = uid
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single()
      if (error) {
        console.error('Failed to load profile:', error.message)
        // Mark the uid as attempted so useProtectedRoute can unblock after a failure
        lastFetchedUid = uid
        return
      }
      if (data) setProfile(data)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setHydrated(true)
      if (session?.user.id) fetchProfile(session.user.id)
    })

    // Process Supabase auth tokens that arrive via deep link (e.g. password reset emails).
    // supabase-js only auto-processes URLs on web; on native we must do it manually.
    const handleAuthUrl = async (url: string | null) => {
      if (!url) return
      const hash = url.split('#')[1]
      if (!hash) return
      const params = new URLSearchParams(hash)
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token })
      }
    }
    Linking.getInitialURL().then(handleAuthUrl)
    const linkingSub = Linking.addEventListener('url', ({ url }) => { handleAuthUrl(url) })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/reset-password' as any)
        return
      }
      const previousSession = useAuthStore.getState().session
      setSession(newSession)
      // Safety net: if getSession() hasn't resolved yet, mark hydrated now so routing
      // doesn't stay blocked while the local-storage read is slow.
      if (!useAuthStore.getState().hydrated) setHydrated(true)

      if (newSession?.user.id) {
        // Reset dedup when the signed-in user changes so the new user's profile loads
        if (lastFetchedUid !== newSession.user.id) lastFetchedUid = null
        await fetchProfile(newSession.user.id)
        if (!previousSession && newSession) {
          const guestItems = useSuitcaseStore.getState().items
          if (guestItems.length > 0) {
            const inserts = guestItems.map(item => ({
              user_id: newSession.user.id,
              piece_id: item.piece_id,
              size: item.size,
            }))
            await supabase.from('suitcase_items').upsert(inserts, { onConflict: 'user_id,piece_id,size' })
          }
        }
      } else {
        lastFetchedUid = null
        setProfile(null)
        // Clear local suitcase on sign-out so a different user signing in on the same
        // device doesn't inherit the previous user's cart.
        useSuitcaseStore.getState().clearSuitcase()
      }
    })
    return () => { subscription.unsubscribe(); linkingSub.remove() }
  }, [setSession, setProfile, setHydrated])

  if (!fontsLoaded && !fontError) return null

  return (
    <QueryClientProvider client={queryClient}>
      <StripeWrapper>
        <SafeAreaProvider>
          <NavigationGuard />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="rental-terms" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="privacy" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="reset-password" options={{ headerShown: false }} />
            <Stack.Screen name="wardrobe/[id]" />
            <Stack.Screen name="piece/[id]" />
            <Stack.Screen name="checkout/index" options={{ gestureEnabled: false }} />
            <Stack.Screen name="checkout/confirmation" options={{ gestureEnabled: false }} />
            <Stack.Screen name="order/[id]" />
            <Stack.Screen name="update-address" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="faq" options={{ headerShown: false }} />
          </Stack>
        </SafeAreaProvider>
      </StripeWrapper>
    </QueryClientProvider>
  )
}
