import { Pressable, View, Text } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { colors } from '@/constants/colors'
import { formatCentsPerMonth, formatCents, conditionBadgeLabel } from '@/utils/format'
import { COLOR_HEX } from '@/constants/inventory'
import { multiPieceDiscount } from '@/utils/pricing'
import { useSuitcaseStore } from '@/store/suitcaseStore'
import { DEFAULT_BLURHASH } from '@/constants/layout'
import type { Piece } from '@/types'

interface PieceCardProps {
  piece: Piece
  index?: number
}

export function PieceCard({ piece, index = 0 }: PieceCardProps) {
  // Subscribe to computed discount, not raw item count — only re-renders when the discount TIER changes
  // (e.g., 2→3 items both give 18%, so no re-render; 1→2 items changes 0%→8%, so re-render)
  const bundleDiscount = useSuitcaseStore(s =>
    s.items.length >= 1 ? multiPieceDiscount(s.items.length + 1) : 0
  )

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={{ flex: 1, margin: 6 }}>
      <Pressable
        onPress={() => router.push({ pathname: '/piece/[id]', params: { id: piece.id } } as any)}
        accessibilityLabel={`${piece.brand} ${piece.name}, ${formatCentsPerMonth(piece.rental_fee)}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
        <View style={{
          backgroundColor: colors.white, borderRadius: 16, overflow: 'hidden',
          shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 }, elevation: 2,
        }}>
          <Image
            source={piece.images[0] ?? null}
            placeholder={DEFAULT_BLURHASH}
            contentFit="cover"
            style={{ width: '100%', aspectRatio: 3 / 4 }}
            transition={300}
          />
          {!piece.is_available && (
            <View style={{
              position: 'absolute', top: 8, right: 8,
              backgroundColor: colors.error + 'CC', borderRadius: 6,
              paddingHorizontal: 6, paddingVertical: 3,
            }}>
              <Text style={{ color: colors.white, fontFamily: 'Inter-Medium', fontSize: 10 }}>Rented</Text>
            </View>
          )}
          <View style={{ padding: 12, gap: 4 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: colors.slate, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {piece.brand}
            </Text>
            <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 15, color: colors.navy }} numberOfLines={2}>
              {piece.name}
            </Text>

            {/* Rental price + color dot */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy }}>
                {formatCentsPerMonth(piece.rental_fee)}
              </Text>
              {piece.color && COLOR_HEX[piece.color] && (
                <View style={{
                  width: 10, height: 10, borderRadius: 5,
                  backgroundColor: COLOR_HEX[piece.color],
                  borderWidth: 1, borderColor: colors.sand,
                }} />
              )}
            </View>

            {/* Buyout price */}
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.slate }}>
              Own: {formatCents(piece.buyout_price)}
            </Text>

            {/* Condition label: "Like New · 2× rented" */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
              <View style={{
                backgroundColor: piece.wear_count === 0 ? colors.navy + '15' : colors.slate + '12',
                borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2,
              }}>
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: piece.wear_count === 0 ? colors.navy : colors.slate }}>
                  {conditionBadgeLabel(piece.condition, piece.wear_count)}
                </Text>
              </View>

              {/* Multi-piece bundle discount badge */}
              {bundleDiscount > 0 && (
                <View style={{ backgroundColor: colors.success + '20', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 }}>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: colors.success }}>
                    {Math.round(bundleDiscount * 100)}% bundle
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}
