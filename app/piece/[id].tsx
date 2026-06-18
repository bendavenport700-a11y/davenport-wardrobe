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
import { usePieceReviews, type Review } from '@/hooks/useReviews'
import { useAuthStore } from '@/store/authStore'
import { useSuitcaseStore } from '@/store/suitcaseStore'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PricingBlock } from '@/components/piece/PricingBlock'
import { PieceCard } from '@/components/piece/PieceCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { formatCents, wearCountLabel, conditionLabel } from '@/utils/format'
import { DEPOSIT_CENTS } from '@/constants/billing'
import { SIZES_BY_CATEGORY } from '@/constants/inventory'
import { supabase } from '@/lib/supabase'
import { colors } from '@/constants/colors'
import { layout, DEFAULT_BLURHASH } from '@/constants/layout'

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Text key={n} style={{ fontSize: size, color: n <= Math.round(rating) ? colors.accent : colors.sand }}>★</Text>
      ))}
    </View>
  )
}

function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const avg = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 22, color: colors.navy, letterSpacing: 0.2 }}>
          Reviews
        </Text>
        {reviews.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Stars rating={avg} />
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.slate }}>
              {avg.toFixed(1)} · {reviews.length}
            </Text>
          </View>
        )}
      </View>

      {reviews.length === 0 ? (
        <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: colors.sand + '80', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, textAlign: 'center', lineHeight: 21 }}>
            No reviews yet. Rent it and be the first.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {reviews.slice(0, 5).map(r => (
            <View key={r.id} style={{ backgroundColor: colors.white, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.sand + '80', gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stars rating={r.rating} size={13} />
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.slate + '90' }}>
                  {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </Text>
              </View>
              {r.body && (
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, lineHeight: 20 }}>
                  {r.body}
                </Text>
              )}
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: colors.slate + '70', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Verified renter
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

export default function PieceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useAuthStore()
  const { addItem, hasItem } = useSuitcaseStore()
  const { width: screenWidth } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const { data: piece, isLoading, isError, refetch } = usePiece(id)
  const { data: reviews = [] } = usePieceReviews(id)
  const { data: similarData } = usePieces({
    category: piece?.category, availableOnly: true, pageSize: 4,
    enabled: !!piece?.category,
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

  // Sizes that have at least one available unit — from piece_units (authoritative)
  const availableUnitSizes = [...new Set((piece?.availableUnits ?? []).map(u => u.size))]
  // Order by category size order if possible
  const categorySizes = SIZES_BY_CATEGORY[piece?.category ?? '']
  const pieceSizes = categorySizes
    ? categorySizes.filter(s => availableUnitSizes.includes(s))
    : availableUnitSizes

  // Best unit for the selected size (least worn)
  const selectedUnit = selectedSize
    ? (piece?.availableUnits ?? []).find(u => u.size === selectedSize)
    : null

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
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {/* Back button fixed above the scroll */}
      <Pressable
        onPress={() => router.back()}
        accessibilityLabel="Go back"
        accessibilityRole="button"
        style={{
          position: 'absolute', top: insets.top + 12, left: 16, zIndex: 10,
          backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
        }}
      >
        <Text style={{ color: colors.white, fontFamily: 'Inter-Medium', fontSize: 13, letterSpacing: 0.1 }}>← Back</Text>
      </Pressable>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

      {/* Image gallery */}
      <View style={{ backgroundColor: colors.white }}>
        <ScrollView
          horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          onScroll={e => setImageIdx(Math.round(e.nativeEvent.contentOffset.x / (e.nativeEvent.layoutMeasurement.width || 1)))}
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
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: colors.slate, textTransform: 'uppercase', letterSpacing: 1.8, marginBottom: 5 }}>
            {piece.brand}
          </Text>
          <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 27, color: colors.navy, letterSpacing: 0.1 }}>
            {piece.name}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
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
              backgroundColor: colors.navy + '08', borderRadius: 14, padding: 14,
              borderWidth: 1, borderColor: colors.navy + '12',
            }}>
            <View style={{ gap: 2 }}>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 10, color: colors.slate, textTransform: 'uppercase', letterSpacing: 1.0 }}>
                Part of
              </Text>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy, letterSpacing: 0.1 }}>
                {wardrobe.name}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={15} color={colors.navy + 'AA'} />
          </Pressable>
        )}

        {/* Wear / condition info — updates when a size is selected */}
        <View style={{ backgroundColor: colors.navy + '07', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.navy + '10' }}>
          {selectedUnit ? (
            selectedUnit.wear_count === 0 ? (
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, lineHeight: 21 }}>
                This size ships brand new — you'll be the first to wear it.
              </Text>
            ) : (
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, lineHeight: 21 }}>
                This size has {selectedUnit.wear_count} {selectedUnit.wear_count === 1 ? 'wear' : 'wears'} — at Davenport, one wear equals one month rented. Professionally dry cleaned and inspected before shipping.
              </Text>
            )
          ) : piece.is_available ? (
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, lineHeight: 21 }}>
              Select a size to see wear history. Every piece is dry cleaned and inspected before shipping.
            </Text>
          ) : (
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, lineHeight: 21 }}>
              Professionally dry cleaned and inspected before shipping.
            </Text>
          )}
        </View>

        {/* Pricing */}
        <PricingBlock piece={piece} />

        {/* Unavailable */}
        {!piece.is_available && (
          <View style={{ backgroundColor: colors.error + '15', borderRadius: 12, padding: 14 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.error }}>
              Currently rented out. Check back soon.
            </Text>
          </View>
        )}

        {/* Guest upsell */}
        {!session && piece.is_available && (
          <View style={{ backgroundColor: colors.navy, borderRadius: 14, padding: 16, gap: 8 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.cream }}>
              {formatCents(DEPOSIT_CENTS)} refundable deposit · Ships in 1–2 weeks
            </Text>
            <Pressable onPress={() => router.push('/(auth)/signup')} style={{
              backgroundColor: colors.cream, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4,
            }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.navy }}>
                Create a Free Account →
              </Text>
            </Pressable>
          </View>
        )}

        {/* Size selector */}
        {piece.is_available && pieceSizes.length > 0 && (
          <View>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy, marginBottom: 12, letterSpacing: 0.2, textTransform: 'uppercase' }}>
              Select Size
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {pieceSizes.map(size => {
                const selected = selectedSize === size
                const unit = (piece.availableUnits ?? []).find(u => u.size === size)
                const isNew = (unit?.wear_count ?? 0) === 0
                return (
                  <Pressable
                    key={size}
                    onPress={() => setSelectedSize(size)}
                    accessibilityState={{ selected }}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5,
                      backgroundColor: selected ? colors.navy : colors.white,
                      borderColor: selected ? colors.navy : colors.sand + 'CC',
                      alignItems: 'center',
                    }}>
                    <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: selected ? colors.cream : colors.navy }}>
                      {size}
                    </Text>
                    <Text style={{
                      fontFamily: 'Inter-Regular', fontSize: 10, marginTop: 2,
                      color: selected
                        ? (isNew ? colors.cream + 'BB' : colors.cream + '99')
                        : (isNew ? colors.success : colors.slate),
                    }}>
                      {isNew ? 'New' : unit != null ? `${unit.wear_count}w` : '—'}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            {!selectedSize && (
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate + 'AA', marginTop: 10, letterSpacing: 0.1 }}>
                Select a size to continue
              </Text>
            )}
          </View>
        )}

        {/* Add to Suitcase — only when there are sizes to pick from */}
        {piece.is_available && session && pieceSizes.length > 0 && (
          alreadyInSuitcase ? (
            <Button label="In Your Suitcase · View" variant="secondary" onPress={() => router.push('/(tabs)/suitcase' as any)} />
          ) : (
            <Button
              label={selectedSize ? `Add to Suitcase · ${formatCents(piece.rental_fee)}/mo` : 'Select a Size First'}
              onPress={handleAddToSuitcase}
              disabled={!selectedSize}
            />
          )
        )}

        {/* Description */}
        {piece.description && (
          <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: colors.sand + '80' }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy, marginBottom: 8, letterSpacing: 0.1 }}>
              About this piece
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, lineHeight: 22 }}>
              {piece.description}
            </Text>
          </View>
        )}

        {/* Reviews */}
        <ReviewsSection reviews={reviews} />

        {/* You May Also Like */}
        {similarPieces.length > 0 && (
          <View>
            <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 22, color: colors.navy, marginBottom: 14, letterSpacing: 0.2 }}>
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
    </View>
  )
}
