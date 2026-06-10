import { useEffect } from 'react'
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
  const { setSession, setProfile } = useAuthStore()

  const [fontsLoaded, fontError] = useFonts({
    'PlayfairDisplay-Bold': require('@/assets/fonts/PlayfairDisplay-Bold.ttf'),
    'Inter-Regular': require('@/assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('@/assets/fonts/Inter-Medium.ttf'),
  })

  useEffect(() => {
    if (fontError) console.error('Font load error:', fontError)
    if (fontsLoaded || fontError) SplashScreen.hideAsync()
  }, [fontsLoaded, fontError])

  useEffect(() => {
    const fetchProfile = async (uid: string) => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single()
      if (error) {
        console.error('Failed to load profile:', error.message)
        return
      }
      if (data) setProfile(data)
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user.id) fetchProfile(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/reset-password' as any)
        return
      }
      const previousSession = useAuthStore.getState().session
      setSession(newSession)
      if (newSession?.user.id) {
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
        setProfile(null)
        // Do NOT clear suitcase on sign-out — items persist in AsyncStorage so
        // they're available immediately on next login and merge into the server cart.
      }
    })
    return () => subscription.unsubscribe()
  }, [setSession, setProfile])

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
          </Stack>
        </SafeAreaProvider>
      </StripeWrapper>
    </QueryClientProvider>
  )
}
