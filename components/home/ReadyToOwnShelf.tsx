import { View, Text, Pressable, ScrollView } from 'react-native'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useReadyToOwn } from '@/hooks/useReadyToOwn'
import { formatCents, formatCentsPerMonth } from '@/utils/format'
import { colors } from '@/constants/colors'
import { layout, DEFAULT_BLURHASH } from '@/constants/layout'

export function ReadyToOwnShelf() {
  const { data: pieces = [], isLoading } = useReadyToOwn(10)

  if (!isLoading && pieces.length === 0) return null

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()}>
      {/* Header */}
      <View style={{
        paddingHorizontal: layout.screenPadding,
        paddingBottom: 14,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
      }}>
        <View style={{ gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <View style={{
              backgroundColor: colors.accent,
              borderRadius: 5,
              paddingHorizontal: 7,
              paddingVertical: 3,
            }}>
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 9, color: colors.cream, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                Deal
              </Text>
            </View>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20, color: colors.cream, letterSpacing: -0.5 }}>
              Ready to Own
            </Text>
          </View>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.sand, lineHeight: 18 }}>
            Veteran pieces at their lowest buyout price
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/pieces' as any)}
          hitSlop={12}
          accessibilityRole="button"
        >
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.sand + 'CC' }}>
            All →
          </Text>
        </Pressable>
      </View>

      {/* Horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: layout.screenPadding, gap: 12 }}
      >
        {isLoading
          ? [0, 1, 2].map(i => (
              <View key={i} style={{
                width: 148,
                backgroundColor: colors.ink,
                borderRadius: 16,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: colors.sand + '18',
              }}>
                <View style={{ width: 148, height: 186, backgroundColor: colors.navy + '80' }} />
                <View style={{ padding: 10, gap: 6 }}>
                  <View style={{ height: 10, width: '60%', backgroundColor: colors.sand + '20', borderRadius: 4 }} />
                  <View style={{ height: 12, width: '80%', backgroundColor: colors.sand + '30', borderRadius: 4 }} />
                  <View style={{ height: 10, width: '50%', backgroundColor: colors.sand + '20', borderRadius: 4 }} />
                </View>
              </View>
            ))
          : pieces.map(piece => (
              <Pressable
                key={piece.id}
                onPress={() => router.push({ pathname: '/piece/[id]', params: { id: piece.id } } as any)}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  width: 148,
                  backgroundColor: colors.ink,
                  borderRadius: 16,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: colors.sand + '25',
                  opacity: pressed ? 0.88 : 1,
                })}
              >
                {/* Image */}
                <View style={{ width: 148, height: 186, position: 'relative' }}>
                  {piece.images?.[0] ? (
                    <Image
                      source={piece.images[0]}
                      placeholder={DEFAULT_BLURHASH}
                      style={{ width: 148, height: 186 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={{ flex: 1, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontFamily: 'Inter-Bold', fontSize: 28, color: colors.cream + '30' }}>D</Text>
                    </View>
                  )}
                  {/* Wear count badge */}
                  <View style={{
                    position: 'absolute', top: 8, left: 8,
                    backgroundColor: colors.ink + 'CC',
                    borderRadius: 20, paddingHorizontal: 7, paddingVertical: 3,
                    flexDirection: 'row', alignItems: 'center', gap: 3,
                  }}>
                    <Ionicons name="star" size={8} color={colors.accent} />
                    <Text style={{ fontFamily: 'Inter-Medium', fontSize: 9.5, color: colors.cream, letterSpacing: 0.1 }}>
                      {piece.wear_count} wears
                    </Text>
                  </View>
                </View>

                {/* Info */}
                <View style={{ padding: 10, gap: 4 }}>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: colors.sand + '70', textTransform: 'uppercase', letterSpacing: 0.8 }} numberOfLines={1}>
                    {piece.brand}
                  </Text>
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 13, color: colors.cream, letterSpacing: -0.2, lineHeight: 17 }} numberOfLines={2}>
                    {piece.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                    <Text style={{ fontFamily: 'Inter-Regular', fontSize: 10, color: colors.sand + '70' }}>
                      Own for
                    </Text>
                    <Text style={{ fontFamily: 'Inter-Bold', fontSize: 13, color: colors.accent }}>
                      {formatCents(piece.buyout_price)}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 10, color: colors.sand + '50' }}>
                    {formatCentsPerMonth(piece.rental_fee)} to rent
                  </Text>
                </View>
              </Pressable>
            ))
        }
      </ScrollView>
    </Animated.View>
  )
}
