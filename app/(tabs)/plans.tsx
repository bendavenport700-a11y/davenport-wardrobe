import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/store/authStore'
import { useTabBarStore } from '@/store/tabBarStore'
import { useTrips } from '@/hooks/useTrips'
import { TripCard } from '@/components/trip/TripCard'
import { colors } from '@/constants/colors'
import { layout } from '@/constants/layout'
import { useRef } from 'react'

export default function PlansTab() {
  const insets = useSafeAreaInsets()
  const { session } = useAuthStore()
  const userId = session?.user.id
  const { data: trips, isLoading } = useTrips(userId)
  const setScrolledDown = useTabBarStore(s => s.setScrolledDown)
  const lastScrollY = useRef(0)

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        onScroll={e => {
          const y = e.nativeEvent.contentOffset.y
          if (y > lastScrollY.current + 30) { setScrolledDown(true); lastScrollY.current = y }
          else if (y < lastScrollY.current - 30) { setScrolledDown(false); lastScrollY.current = y }
        }}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: layout.screenPadding,
        }}
      >
        {/* Header — mirrors web exactly */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 28 }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontFamily: 'Inter-Medium', fontSize: 9,
              color: colors.slate + '55',
              textTransform: 'uppercase', letterSpacing: 4, marginBottom: 8,
            }}>
              Davenport
            </Text>
            <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 38, color: colors.navy, letterSpacing: -0.5, lineHeight: 42 }}>
              Plans
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate + '80', marginTop: 8, lineHeight: 20, maxWidth: 240 }}>
              Curate pieces for a trip, event, or season. Add everything to your suitcase when you're ready.
            </Text>
          </View>

          {session && (
            <Pressable
              onPress={() => router.push('/trip/new' as any)}
              accessibilityRole="button"
              accessibilityLabel="Create a new plan"
              style={({ pressed }) => ({
                backgroundColor: colors.navy,
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 11,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                opacity: pressed ? 0.88 : 1,
                marginTop: 28,
                flexShrink: 0,
              })}
            >
              <Ionicons name="add" size={15} color={colors.cream} />
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.cream }}>New Plan</Text>
            </Pressable>
          )}
        </View>

        {/* Content */}
        {!session ? (
          /* Not signed in */
          <View style={{
            backgroundColor: colors.white,
            borderRadius: 24, padding: 40,
            alignItems: 'center', gap: 16,
            borderWidth: 1, borderColor: colors.sand,
          }}>
            <View style={{
              width: 56, height: 56, borderRadius: 16,
              backgroundColor: colors.sand + '99',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="list-outline" size={26} color={colors.navy + '50'} />
            </View>
            <View style={{ gap: 6, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 22, color: colors.navy, textAlign: 'center' }}>
                Sign in to use Plans
              </Text>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate + '80', textAlign: 'center', lineHeight: 20, maxWidth: 220 }}>
                Save pieces for a trip, event, or season.
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/(auth)/login' as any)}
              style={({ pressed }) => ({
                backgroundColor: colors.navy, borderRadius: 16,
                paddingHorizontal: 28, paddingVertical: 14,
                opacity: pressed ? 0.88 : 1,
              })}
            >
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.cream }}>Sign In</Text>
            </Pressable>
          </View>

        ) : isLoading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: 40 }} />

        ) : (trips?.length ?? 0) === 0 ? (
          /* Empty state — mirrors web */
          <View style={{
            backgroundColor: colors.white,
            borderRadius: 24, padding: 40,
            alignItems: 'center', gap: 16,
            borderWidth: 1, borderColor: colors.sand,
          }}>
            <View style={{
              width: 56, height: 56, borderRadius: 16,
              backgroundColor: colors.sand + '99',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="list-outline" size={26} color={colors.navy + '50'} />
            </View>
            <View style={{ gap: 6, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 22, color: colors.navy, textAlign: 'center' }}>
                No plans yet
              </Text>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate + '70', textAlign: 'center', lineHeight: 20, maxWidth: 220 }}>
                Start by creating a plan, then browse pieces and save them to it.
              </Text>
            </View>
            <View style={{ gap: 10, width: '100%', alignItems: 'center' }}>
              <Pressable
                onPress={() => router.push('/trip/new' as any)}
                style={({ pressed }) => ({
                  backgroundColor: colors.navy, borderRadius: 16,
                  paddingHorizontal: 28, paddingVertical: 14,
                  opacity: pressed ? 0.88 : 1,
                  width: '100%', alignItems: 'center',
                })}
              >
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.cream }}>
                  Create your first plan
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(tabs)/pieces' as any)}
                style={({ pressed }) => ({
                  borderWidth: 1.5, borderColor: colors.navy + '30',
                  borderRadius: 16, paddingHorizontal: 28, paddingVertical: 13,
                  opacity: pressed ? 0.88 : 1,
                  width: '100%', alignItems: 'center',
                })}
              >
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.navy }}>
                  Browse pieces →
                </Text>
              </Pressable>
            </View>
          </View>

        ) : (
          /* Plan list */
          <View style={{ gap: 10 }}>
            {trips?.map((trip, i) => (
              <Animated.View key={trip.id} entering={FadeInDown.delay(i * 50).springify()}>
                <TripCard trip={trip} />
              </Animated.View>
            ))}
            <Pressable
              onPress={() => router.push('/(tabs)/pieces' as any)}
              style={{ alignItems: 'center', paddingTop: 12 }}
            >
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate + '70' }}>
                Browse more pieces →
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
