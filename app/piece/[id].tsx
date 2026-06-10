import { useState } from 'react'
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { usePiece } from '@/hooks/usePiece'
import { usePieces } from '@/hooks/usePieces'
import { useAuthStore } from '@/store/authStore'
import { useSuitcaseStore } from '@/store/suitcaseStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PricingBlock } from '@/components/piece/PricingBlock'
import { PieceCard } from '@/components/piece/PieceCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { formatCents, wearCountLabel, conditionLabel } from '@/utils/format'
import { SIZES_BY_CATEGORY } from '@/constants/inventory'
import { supabase } from '@/lib/supabase'
import { colors } from '@/constants/colors'
import { layout, DEFAULT_BLURHASH } from '@/constants/layout'

export default function PieceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useAuthStore()
  const { addItem, hasItem } = useSuitcaseStore()
  const { width: screenWidth } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const { data: piece, isLoading, isError, refetch } = usePiece(id)
  const { data: similarData } = usePieces({
    category: piece?.category, availableOnly: true, pageSize: 4,
  })
  const similarPieces = (similarData?.pages.flat() ?? []).filter(p => p.id !== id).slice(0, 4)

  const { data: wardrobe } = useQuery({
    queryKey: ['wardrobe-for-piece', piece?.wardrobe_id],
    enabled: !!piece?.wardrobe_id,
    queryFn: async () => {
      const { data } = await supabase
        .from('wardrobes').select('id, name').eq('id', piece!.wardrobe_id!).single()
      return data
    },
    staleTime: 5 * 60_000,
  })

  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [imageIdx, setImageIdx] = useState(0)

  const alreadyInSuitcase = selectedSize ? hasItem(id, selectedSize) : false
  // Use category-mapped sizes when available, otherwise fall back to whatever
  // sizes are stored directly on the piece (handles unknown/new categories).
  const categorySizes = SIZES_BY_CATEGORY[piece?.category ?? '']
  const pieceSizes = categorySizes
    ? categorySizes.filter(s => piece?.sizes_available.includes(s))
    : (piece?.sizes_available ?? [])

  const handleAddToSuitcase = () => {
    if (!selectedSize || !piece) return
    if (!session) { router.push('/(auth)/login' as any); return }
    addItem(piece, selectedSize)
    router.push('/(tabs)/suitcase' as any)
  }

  if (isError) {
    return <ErrorState message="Couldn't load this piece." onRetry={() => refetch()} />
  }

  if (isLoading || !piece) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.cream }}>
        <Skeleton height={400} borderRadius={0} />
        <View style={{ padding: layout.screenPadding, gap: 16 }}>
          <Skeleton height={28} width="70%" />
          <Skeleton height={20} width="40%" />
          <Skeleton height={80} borderRadius={12} />
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} showsVerticalScrollIndicator={false}>
      <Pressable
        onPress={() => router.back()}
        accessibilityLabel="Go back"
        accessibilityRole="button"
        style={{
          position: 'absolute', top: insets.top + 12, left: 16, zIndex: 10,
          backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
        }}
      >
        <Text style={{ color: colors.white, fontFamily: 'Inter-Medium', fontSize: 14 }}>← Back</Text>
      </Pressable>

      {/* Image gallery */}
      <View style={{ backgroundColor: colors.white }}>
        <ScrollView
          horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          onScroll={e => setImageIdx(Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width))}
          scrollEventThrottle={16}>
          {(piece.images.length ? piece.images : [null]).map((img, i) => (
            <Image
              key={i}
              source={img ?? undefined}
              style={{ width: screenWidth, aspectRatio: 3 / 4 }}
              contentFit="cover"
              placeholder={DEFAULT_BLURHASH}
            />
          ))}
        </ScrollView>
        {piece.images.length > 1 && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10 }}>
            {piece.images.map((_, i) => (
              <View key={i} style={{
                width: 6, height: 6, borderRadius: 3,
                backgroundColor: i === imageIdx ? colors.navy : colors.sand,
              }} />
            ))}
          </View>
        )}
      </View>

      <View style={{ padding: layout.screenPadding, gap: 20 }}>
        {/* Brand + Name */}
        <View>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: colors.slate, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
            {piece.brand}
          </Text>
          <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 26, color: colors.navy }}>
            {piece.name}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <Badge label={piece.category} color={colors.slate} />
            <Badge label={conditionLabel(piece.condition)} color={colors.success} />
          </View>
        </View>

        {/* Wardrobe link — shown if this piece belongs to a curated wardrobe */}
        {wardrobe && (
          <Pressable
            onPress={() => router.push({ pathname: '/wardrobe/[id]', params: { id: wardrobe.id } } as any)}
            accessibilityRole="button"
            accessibilityLabel={`View ${wardrobe.name} wardrobe`}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: colors.navy + '08', borderRadius: 12, padding: 12,
            }}>
            <View style={{ gap: 1 }}>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.slate, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Part of
              </Text>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy }}>
                {wardrobe.name}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.navy} />
          </Pressable>
        )}

        {/* Hygiene trust signal */}
        <View style={{ backgroundColor: colors.navy + '08', borderRadius: 12, padding: 12 }}>
          {piece.wear_count === 0 ? (
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, lineHeight: 20 }}>
              This piece ships brand new with tags attached. You'll be the first person to wear it.
            </Text>
          ) : (
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, lineHeight: 20 }}>
              {wearCountLabel(piece.wear_count)}. Professionally dry cleaned and inspected before shipping.
            </Text>
          )}
        </View>

        {/* Pricing */}
        <PricingBlock piece={piece} />

        {/* Unavailable */}
        {!piece.is_available && (
          <View style={{ backgroundColor: colors.error + '15', borderRadius: 12, padding: 14 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.error }}>
              Currently rented out — check back soon.
            </Text>
          </View>
        )}

        {/* Guest upsell */}
        {!session && piece.is_available && (
          <View style={{ backgroundColor: colors.navy, borderRadius: 14, padding: 16, gap: 8 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.cream }}>
              $75 refundable deposit · From $12/mo · Ships in 2–3 days
            </Text>
            <Pressable onPress={() => router.push('/(auth)/signup')} style={{
              backgroundColor: colors.cream, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4,
            }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.navy }}>
                Create Account — It's Free →
              </Text>
            </Pressable>
          </View>
        )}

        {/* Size selector */}
        {piece.is_available && pieceSizes.length > 0 && (
          <View>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.navy, marginBottom: 10 }}>
              Select Size
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {pieceSizes.map(size => {
                const selected = selectedSize === size
                return (
                  <Pressable
                    key={size}
                    onPress={() => setSelectedSize(size)}
                    accessibilityState={{ selected }}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5,
                      backgroundColor: selected ? colors.navy : colors.white,
                      borderColor: selected ? colors.navy : colors.sand,
                    }}>
                    <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: selected ? colors.cream : colors.navy }}>
                      {size}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            {!selectedSize && (
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, marginTop: 8 }}>
                Select a size to continue
              </Text>
            )}
          </View>
        )}

        {/* Add to Suitcase */}
        {piece.is_available && session && (
          alreadyInSuitcase ? (
            <Button label="Added to Suitcase — View" variant="secondary" onPress={() => router.push('/(tabs)/suitcase' as any)} />
          ) : (
            <Button
              label={selectedSize ? `Add to Suitcase — ${formatCents(piece.rental_fee)}/mo` : 'Select a Size First'}
              onPress={handleAddToSuitcase}
              disabled={!selectedSize}
            />
          )
        )}

        {/* Description */}
        {piece.description && (
          <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 16 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.navy, marginBottom: 8 }}>
              About this piece
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, lineHeight: 22 }}>
              {piece.description}
            </Text>
          </View>
        )}

        {/* You May Also Like */}
        {similarPieces.length > 0 && (
          <View>
            <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 20, color: colors.navy, marginBottom: 12 }}>
              You May Also Like
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {similarPieces.map((p, i) => (
                <Animated.View key={p.id} entering={FadeInDown.delay(i * 50).springify()} style={{ width: 160 }}>
                  <PieceCard piece={p} />
                </Animated.View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  )
}
