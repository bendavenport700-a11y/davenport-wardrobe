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

export default function PlansScreen() {
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
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40, paddingHorizontal: layout.screenPadding, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back"
          style={{ marginBottom: 4 }}>
          <Ionicons name="arrow-back" size={22} color={colors.navy} />
        </Pressable>

        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ gap: 4, flex: 1 }}>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 30, color: colors.navy, letterSpacing: -0.7 }}>
              My Plans
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, lineHeight: 20 }}>
              Curate pieces for a trip, event, or season.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/trip/new' as any)}
            accessibilityRole="button"
            accessibilityLabel="Create a new plan"
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: colors.navy,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 11,
              opacity: pressed ? 0.88 : 1,
              marginTop: 4,
            })}
          >
            <Ionicons name="add" size={16} color={colors.cream} />
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.cream }}>New Plan</Text>
          </Pressable>
        </View>

        {/* Content */}
        {isLoading ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: 32 }} />
        ) : (trips?.length ?? 0) === 0 ? (
          <View style={{
            backgroundColor: colors.white, borderRadius: 20, padding: 32,
            alignItems: 'center', gap: 14,
            borderWidth: 1, borderColor: colors.sand + '80', marginTop: 8,
          }}>
            <View style={{
              width: 56, height: 56, borderRadius: 16,
              backgroundColor: colors.sand + '60',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="list-outline" size={26} color={colors.navy + '60'} />
            </View>
            <View style={{ gap: 6, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: colors.navy, textAlign: 'center' }}>
                No plans yet
              </Text>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, textAlign: 'center', lineHeight: 21, maxWidth: 240 }}>
                Create a plan, then browse pieces and save them to it. Add everything to your suitcase when you're ready.
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/trip/new' as any)}
              style={({ pressed }) => ({
                backgroundColor: colors.navy, borderRadius: 14,
                paddingHorizontal: 24, paddingVertical: 13,
                opacity: pressed ? 0.88 : 1, marginTop: 4,
              })}
            >
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.cream }}>
                Create your first plan
              </Text>
            </Pressable>
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
