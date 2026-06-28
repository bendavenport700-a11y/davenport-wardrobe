import { Pressable, View, Text } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { colors } from '@/constants/colors'
import { formatCentsPerMonth, wearTierLabel } from '@/utils/format'
import { DEFAULT_BLURHASH } from '@/constants/layout'
import type { Piece } from '@/types'

interface PieceCardProps {
  piece: Piece
  index?: number
}

export function PieceCard({ piece, index = 0 }: PieceCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={{ flex: 1, margin: 6 }}>
      <Pressable
        onPress={() => router.push({ pathname: '/piece/[id]', params: { id: piece.id } } as any)}
        accessibilityLabel={`${piece.brand} ${piece.name}, ${formatCentsPerMonth(piece.rental_fee)}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
      >
        <View style={{
          backgroundColor: colors.white, borderRadius: 18, overflow: 'hidden',
          shadowColor: colors.navy, shadowOpacity: 0.08, shadowRadius: 16,
          shadowOffset: { width: 0, height: 4 }, elevation: 3,
        }}>
          {/* Image */}
          <View style={{ width: '100%', aspectRatio: 3 / 4 }}>
            <Image
              source={piece.images?.[0] ?? null}
              recyclingKey={piece.images?.[0] ?? piece.id}
              placeholder={DEFAULT_BLURHASH}
              placeholderContentFit="cover"
              contentFit="cover"
              style={{ width: '100%', height: '100%' }}
              transition={300}
            />
            {!piece.is_available && (
              <View style={{
                position: 'absolute', top: 10, right: 10,
                backgroundColor: 'rgba(15,20,35,0.62)', borderRadius: 6,
                paddingHorizontal: 8, paddingVertical: 4,
              }}>
                <Text style={{ color: colors.cream, fontFamily: 'Inter-Medium', fontSize: 10, letterSpacing: 0.4 }}>
                  Rented
                </Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12, gap: 2 }}>
            <Text style={{
              fontFamily: 'Inter-Medium', fontSize: 9.5,
              color: colors.slate, textTransform: 'uppercase', letterSpacing: 1.4,
            }} numberOfLines={1}>
              {piece.brand}
            </Text>
            <Text style={{
              fontFamily: 'Inter-Bold', fontSize: 13,
              color: colors.navy, lineHeight: 18, letterSpacing: -0.2,
            }} numberOfLines={2}>
              {piece.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: colors.navy }}>
                {formatCentsPerMonth(piece.rental_fee)}
              </Text>
              <View style={{
                backgroundColor: piece.wear_count === 0 ? colors.navy + '12' : colors.slate + '10',
                borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2.5,
              }}>
                <Text style={{
                  fontFamily: 'Inter-Medium', fontSize: 9.5,
                  color: piece.wear_count === 0 ? colors.navy : colors.slate,
                }}>
                  {wearTierLabel(piece.wear_count)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}
