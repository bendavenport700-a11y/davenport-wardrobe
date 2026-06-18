import { useEffect, useRef } from 'react'
import { View, Text, Pressable, Share, ScrollView } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from 'react-native-reanimated'
import ConfettiCannon from 'react-native-confetti-cannon'
import { Ionicons } from '@expo/vector-icons'
import { useOrder } from '@/hooks/useOrder'
import type { Rental } from '@/types'
import { formatCents } from '@/utils/format'
import { colors } from '@/constants/colors'
import { layout } from '@/constants/layout'

type RentalWithPiece = Rental & { piece?: { brand: string; name: string } }

export default function CheckoutConfirmationScreen() {
  const params = useLocalSearchParams<{ order_id: string }>()
  const order_id = Array.isArray(params.order_id) ? params.order_id[0] : params.order_id
  const insets = useSafeAreaInsets()
  const confettiRef = useRef<ConfettiCannon>(null)

  const { data: order } = useOrder(order_id)

  // Animated checkmark scale: 0 → 1 with spring after short delay
  const checkScale = useSharedValue(0)
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }))

  useEffect(() => {
    // Animate checkmark in
    checkScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 200 }))
    // Fire confetti after checkmark appears
    const timer = setTimeout(() => confettiRef.current?.start(), 500)
    return () => clearTimeout(timer)
  }, [])

  const handleShare = async () => {
    const names = order?.rentals?.map(r => (r as RentalWithPiece).piece?.name).filter(Boolean).join(' + ')
      ?? 'my new wardrobe'
    try {
      await Share.share({
        message: `Just rented ${names} from Davenport Wardrobe\nRent premium pieces monthly. Return or own them. No commitment.\nhttps://davenport.rentals?utm_source=share&utm_medium=app`,
        url: 'https://davenport.rentals?utm_source=share&utm_medium=app',
      })
    } catch {
      // User cancelled or share not supported — nothing to do
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {/* Confetti fires from top-left corner */}
      <ConfettiCannon
        ref={confettiRef}
        count={80}
        origin={{ x: -10, y: 0 }}
        colors={[colors.navy, colors.sand, '#D4A017', colors.cream]}
        autoStart={false}
        fadeOut
      />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: layout.screenPadding,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 40,
          gap: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated checkmark */}
        <Animated.View style={[checkStyle, {
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: colors.success,
          alignItems: 'center', justifyContent: 'center',
        }]}>
          <Ionicons name="checkmark" size={40} color={colors.white} />
        </Animated.View>

        {/* Headline */}
        <Animated.View entering={FadeInDown.delay(400).springify()} style={{ alignItems: 'center', gap: 8 }}>
          <Text style={{
            fontFamily: 'PlayfairDisplay-Bold', fontSize: 30,
            color: colors.navy, textAlign: 'center', letterSpacing: 0.2,
          }}>
            Your suitcase{'\n'}is on its way.
          </Text>
          <Text style={{
            fontFamily: 'Inter-Regular', fontSize: 16,
            color: colors.slate, textAlign: 'center', lineHeight: 24,
          }}>
            Ships in 1–2 weeks.
          </Text>
          {order_id && (
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.gray400, marginTop: 4 }}>
              Order {order_id.slice(0, 8).toUpperCase()}
            </Text>
          )}
        </Animated.View>

        {/* Order summary from DB */}
        {order?.rentals && order.rentals.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(600).springify()}
            style={{
              backgroundColor: colors.white, borderRadius: 16,
              padding: 18, width: '100%', gap: 8,
              borderWidth: 1, borderColor: colors.sand + '80',
            }}
          >
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy, marginBottom: 4, letterSpacing: 0.1 }}>
              Order Summary
            </Text>
            {(order.rentals as RentalWithPiece[]).map((rental) => (
              <View key={rental.id} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, flex: 1 }} numberOfLines={1}>
                  {[rental.piece?.brand, rental.piece?.name].filter(Boolean).join(' ') || 'Piece'} · Size {rental.size}
                </Text>
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.navy }}>
                  {formatCents(rental.rental_fee_cents)}/mo
                </Text>
              </View>
            ))}
            {order.handling_fee_cents > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.sand }}>
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate }}>Delivery fee</Text>
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate }}>
                  {formatCents(order.handling_fee_cents)}
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* CTAs */}
        <Animated.View entering={FadeInDown.delay(800).springify()} style={{ width: '100%', gap: 12 }}>
          {order_id && (
            <Pressable
              onPress={() => router.push({ pathname: '/order/[id]', params: { id: order_id } } as any)}
              style={{
                backgroundColor: colors.navy, borderRadius: 14,
                paddingVertical: 16, alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 16, color: colors.cream, letterSpacing: 0.2 }}>
                Track Your Order →
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={handleShare}
            style={{
              borderWidth: 1.5, borderColor: colors.navy, borderRadius: 14,
              paddingVertical: 16, alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 16, color: colors.navy, letterSpacing: 0.2 }}>
              Share My Look ↗
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/(tabs)/pieces' as any)}
            style={{ paddingVertical: 12, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, letterSpacing: 0.1 }}>
              Keep Browsing
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  )
}
