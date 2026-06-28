import { useEffect } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/store/authStore'
import { useTrips } from '@/hooks/useTrips'
import { TripCard } from '@/components/trip/TripCard'
import { colors } from '@/constants/colors'
import { layout } from '@/constants/layout'

export default function TripsScreen() {
  const insets = useSafeAreaInsets()
  const { session } = useAuthStore()
  const userId = session?.user.id
  const { data: trips, isLoading } = useTrips(userId)

  useEffect(() => {
    if (!session) router.replace('/(auth)/login' as any)
  }, [session])

  if (!session) return null

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40, paddingHorizontal: layout.screenPadding, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={22} color={colors.navy} />
          </Pressable>
        </View>

        <View style={{ gap: 4 }}>
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 28, color: colors.navy, letterSpacing: -0.7 }}>
            My Trips
          </Text>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate }}>
            Plan your wardrobe around how you actually travel.
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/trip/new' as any)}
          accessibilityRole="button"
          accessibilityLabel="Plan a new trip"
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: colors.navy,
            borderRadius: 14,
            paddingVertical: 15,
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <Ionicons name="add" size={18} color={colors.cream} />
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.cream }}>Plan a Trip</Text>
        </Pressable>

        {isLoading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: 20 }} />
        ) : (trips?.length ?? 0) === 0 ? (
          <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: 28, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.sand + '80', marginTop: 8 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: colors.navy + '0D', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="airplane-outline" size={26} color={colors.navy} />
            </View>
            <View style={{ gap: 5, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 17, color: colors.navy, textAlign: 'center' }}>
                No trips yet
              </Text>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, textAlign: 'center', lineHeight: 21 }}>
                Plan a trip and build a packing list from Davenport's catalog. Every piece, already in your size.
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {trips?.map((trip, i) => (
              <Animated.View key={trip.id} entering={FadeInDown.delay(i * 50).springify()}>
                <TripCard trip={trip} />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
