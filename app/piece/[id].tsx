import { useState } from 'react'
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native'
import * as Haptics from 'expo-haptics'
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
import { useTripsEnabled } from '@/hooks/useAppSettings'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PricingBlock } from '@/components/piece/PricingBlock'
import { PieceCard } from '@/components/piece/PieceCard'
import { TripPickerSheet } from '@/components/trip/TripPickerSheet'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { formatCents, formatCentsPerMonth, wearTierLabel, wearTierDescription } from '@/utils/format'
import { computeRentalFee, computeBuyoutPrice } from '@/utils/pricing'
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
  const { id: rawId } = useLocalSearchParams<{ id: string }>()
  const id = Array.isArray(rawId) ? rawId[0] : rawId
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

  const tripsEnabled = useTripsEnabled()
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedWaist, setSelectedWaist] = useState<string | null>(null)
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>(null)
  const [imageIdx, setImageIdx] = useState(0)
  const [showTripPicker, setShowTripPicker] = useState(false)
  // 'pristine' = prefer 0-wear unit, 'worn' = prefer worn unit, null = not yet chosen
  const [conditionPref, setConditionPref] = useState<'pristine' | 'worn' | null>(null)

  const alreadyInSuitcase = selectedSize ? hasItem(id, selectedSize) : false

  // Sizes that have at least one available unit — from piece_units (authoritative)
  const availableUnitSizes = [...new Set((piece?.availableUnits ?? []).map(u => u.size))]

  // Detect compound sizing (waist+inseam "32x30" or waist+length "32/Regular")
  const sizingType: 'waist_inseam' | 'waist_length' | 'single' =
    availableUnitSizes.some(s => s.includes('x')) ? 'waist_inseam' :
    availableUnitSizes.some(s => s.includes('/')) ? 'waist_length' : 'single'

  // For compound sizes, skip category ordering (e.g. SIZES_BY_CATEGORY has "32" not "32x30")
  const categorySizes = sizingType === 'single' ? SIZES_BY_CATEGORY[piece?.category ?? ''] : null
  const filtered = categorySizes ? categorySizes.filter(s => availableUnitSizes.includes(s)) : null
  // Fall back to unit sizes directly if category list doesn't match (e.g. alpha-sized shorts)
  const pieceSizes = filtered?.length ? filtered : availableUnitSizes

  // For compound sizing: extract unique waist sizes and secondary options for selected waist
  const waistOptions = sizingType !== 'single'
    ? [...new Set(pieceSizes.map(s => s.split(sizingType === 'waist_inseam' ? 'x' : '/')[0]))]
        .sort((a, b) => parseInt(a) - parseInt(b))
    : []
  const secondaryOptions = selectedWaist && sizingType !== 'single'
    ? pieceSizes
        .filter(s => s.startsWith(selectedWaist + (sizingType === 'waist_inseam' ? 'x' : '/')))
        .map(s => s.split(sizingType === 'waist_inseam' ? 'x' : '/')[1])
        .sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0))
    : []
  const secondaryLabel = sizingType === 'waist_inseam' ? 'Inseam' : 'Length'

  function handleWaistSelect(waist: string) {
    setSelectedWaist(waist)
    setSelectedSecondary(null)
    handleSizeChange(null)
  }

  function handleSecondarySelect(secondary: string) {
    setSelectedSecondary(secondary)
    const sep = sizingType === 'waist_inseam' ? 'x' : '/'
    handleSizeChange(selectedWaist ? `${selectedWaist}${sep}${secondary}` : null)
  }

  // All available units for the selected size
  const selectedSizeUnits = selectedSize
    ? (piece?.availableUnits ?? []).filter(u => u.size === selectedSize)
    : []

  // Split units into pristine (0 wears) and worn (1+ wears)
  const pristineUnits = selectedSizeUnits.filter(u => u.wear_count === 0)
  const wornUnits     = selectedSizeUnits.filter(u => u.wear_count > 0)
  const hasChoice     = pristineUnits.length > 0 && wornUnits.length > 0

  // Per-unit pricing: compute from cost_price so it's always accurate
  const pristineFeeCents = piece ? computeRentalFee(piece.cost_price, 0) : 0
  const minWornWear      = wornUnits.length > 0
    ? Math.min(...wornUnits.map(u => u.wear_count))
    : 1
  const wornFeeCents     = piece ? computeRentalFee(piece.cost_price, minWornWear) : 0

  // Effective fee + prefer_worn for the current selection
  const effectivePreferWorn = hasChoice ? conditionPref === 'worn' : wornUnits.length > 0 && pristineUnits.length === 0
  const effectiveFeeCents   = hasChoice
    ? (conditionPref === 'worn' ? wornFeeCents : pristineFeeCents)
    : selectedSizeUnits.length > 0
      ? (pristineUnits.length > 0 ? pristineFeeCents : wornFeeCents)
      : (piece?.rental_fee ?? 0)
  const effectiveWearCount  = hasChoice
    ? (conditionPref === 'worn' ? minWornWear : 0)
    : (selectedSizeUnits[0]?.wear_count ?? piece?.wear_count ?? 0)
  const effectiveBuyoutCents = piece ? computeBuyoutPrice(piece.cost_price, effectiveWearCount) : 0

  // Reset condition pref when size changes
  function handleSizeChange(size: string | null) {
    setSelectedSize(size)
    setConditionPref(null)
  }

  // Wear tier bands for the info panel (renamed)
  const wearBands = [
    {
      label: 'Pristine',
      range: '0 wears',
      count: pristineUnits.length,
      color: colors.success,
    },
    {
      label: 'Excellent',
      range: '1–5 wears',
      count: selectedSizeUnits.filter(u => u.wear_count >= 1 && u.wear_count <= 5).length,
      color: colors.navy,
    },
    {
      label: 'Well-Worn',
      range: '6–10 wears',
      count: selectedSizeUnits.filter(u => u.wear_count >= 6 && u.wear_count <= 10).length,
      color: colors.slate,
    },
    {
      label: 'Veteran',
      range: '11+ wears',
      count: selectedSizeUnits.filter(u => u.wear_count > 10).length,
      color: colors.slate + 'AA',
    },
  ].filter(b => b.count > 0)

  const handleAddToSuitcase = () => {
    if (!selectedSize || !piece) return
    if (!session) { router.push('/(auth)/login' as any); return }
    // If there's a choice and none selected yet, default to pristine
    const preferWorn = hasChoice ? conditionPref === 'worn' : effectivePreferWorn
    addItem(piece, selectedSize, {
      preferWorn,
      rentalFeeCents:     effectiveFeeCents || (piece.rental_fee ?? 0),
      wearCountAtRental:  effectiveWearCount,
    })
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
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
          {((piece.images ?? []).length ? piece.images : [null]).map((img, i) => (
            <Image
              key={img ?? `empty-${i}`}
              source={img ?? undefined}
              recyclingKey={img ?? `empty-${i}`}
              style={{ width: screenWidth, aspectRatio: 3 / 4 }}
              contentFit="cover"
              placeholder={DEFAULT_BLURHASH}
              placeholderContentFit="cover"
            />
          ))}
        </ScrollView>
        {(piece.images ?? []).length > 1 && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10 }}>
            {(piece.images ?? []).map((_, i) => (
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
            <Badge label={wearTierLabel(piece.wear_count)} color={piece.wear_count === 0 ? colors.success : colors.navy} />
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

        {/* Stock & condition breakdown — updates when a size is selected */}
        <View style={{ backgroundColor: colors.navy + '07', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.navy + '10' }}>
          {selectedSizeUnits.length > 0 ? (
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.navy }}>
                  {selectedSizeUnits.length} in stock — {selectedSize}
                </Text>
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.slate, textTransform: 'uppercase', letterSpacing: 1.0 }}>
                  Condition
                </Text>
              </View>
              <View style={{ height: 1, backgroundColor: colors.navy + '10' }} />
              {wearBands.map(band => (
                <View key={band.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: band.color }} />
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, flex: 1 }}>
                    {band.label}
                  </Text>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.navy, minWidth: 24, textAlign: 'right' }}>
                    {band.count}
                  </Text>
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.slate + 'AA', minWidth: 52 }}>
                    {band.range}
                  </Text>
                </View>
              ))}
              <View style={{ height: 1, backgroundColor: colors.navy + '10' }} />
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.slate, lineHeight: 17 }}>
                1 wear = 1 month rented. We always ship the freshest available unit. Every piece is dry cleaned and inspected before shipping.
              </Text>
            </View>
          ) : piece.is_available ? (
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, lineHeight: 21 }}>
              Select a size to see stock and wear history.
            </Text>
          ) : (
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, lineHeight: 21 }}>
              Professionally dry cleaned and inspected before shipping.
            </Text>
          )}
        </View>

        {/* Pricing */}
        <PricingBlock
          piece={piece}
          rentalFeeCents={selectedSizeUnits.length > 0 ? effectiveFeeCents : undefined}
          buyoutCents={selectedSizeUnits.length > 0 ? effectiveBuyoutCents : undefined}
          wearCount={selectedSizeUnits.length > 0 ? effectiveWearCount : undefined}
        />

        {/* Unavailable */}
        {!piece.is_available && (
          <View style={{ backgroundColor: colors.error + '15', borderRadius: 12, padding: 14 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.error }}>
              Currently rented out. Check back soon.
            </Text>
          </View>
        )}

        {/* Guest info — deposit + shipping note (CTA is in the sticky bottom bar) */}
        {!session && piece.is_available && (
          <View style={{ backgroundColor: colors.navy + '08', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.navy + '12' }}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.navy} />
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, flex: 1, lineHeight: 19 }}>
              {formatCents(DEPOSIT_CENTS)} refundable deposit held · Ships in 1–2 weeks
            </Text>
          </View>
        )}

        {/* Size selector */}
        {piece.is_available && pieceSizes.length > 0 && (
          <View style={{ gap: 16 }}>

            {/* Compound sizing: waist first, then inseam/length */}
            {sizingType !== 'single' ? (
              <>
                <View>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy, marginBottom: 12, letterSpacing: 0.2, textTransform: 'uppercase' }}>
                    Waist
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {waistOptions.map(waist => {
                      const selected = selectedWaist === waist
                      return (
                        <Pressable
                          key={waist}
                          onPress={() => handleWaistSelect(waist)}
                          accessibilityState={{ selected }}
                          style={{
                            paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5,
                            backgroundColor: selected ? colors.navy : colors.white,
                            borderColor: selected ? colors.navy : colors.sand + 'CC',
                            alignItems: 'center',
                          }}>
                          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: selected ? colors.cream : colors.navy }}>
                            {waist}"
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                </View>

                {selectedWaist && (
                  <View>
                    <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy, marginBottom: 12, letterSpacing: 0.2, textTransform: 'uppercase' }}>
                      {secondaryLabel}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      {secondaryOptions.map(secondary => {
                        const sep = sizingType === 'waist_inseam' ? 'x' : '/'
                        const sizeKey = `${selectedWaist}${sep}${secondary}`
                        const selected = selectedSecondary === secondary
                        const unitsForKey = (piece.availableUnits ?? []).filter(u => u.size === sizeKey)
                        const stockCount = unitsForKey.length
                        const allNew = stockCount > 0 && unitsForKey.every(u => u.wear_count === 0)
                        return (
                          <Pressable
                            key={secondary}
                            onPress={() => handleSecondarySelect(secondary)}
                            accessibilityState={{ selected }}
                            style={{
                              paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5,
                              backgroundColor: selected ? colors.navy : colors.white,
                              borderColor: selected ? colors.navy : colors.sand + 'CC',
                              alignItems: 'center',
                            }}>
                            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: selected ? colors.cream : colors.navy }}>
                              {sizingType === 'waist_inseam' ? `${secondary}"` : secondary}
                            </Text>
                            <Text style={{
                              fontFamily: 'Inter-Regular', fontSize: 10, marginTop: 2,
                              color: selected ? colors.cream + 'BB' : (allNew ? colors.success : colors.slate),
                            }}>
                              {stockCount > 0 ? (allNew ? `${stockCount} pristine` : `${stockCount} in stock`) : '—'}
                            </Text>
                          </Pressable>
                        )
                      })}
                    </View>
                  </View>
                )}

                {!selectedSize && (
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate + 'AA', letterSpacing: 0.1 }}>
                    {!selectedWaist ? 'Select a waist size to continue' : `Select an ${secondaryLabel.toLowerCase()} to continue`}
                  </Text>
                )}
              </>
            ) : (
              /* Single dimension: existing pill grid */
              <View>
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy, marginBottom: 12, letterSpacing: 0.2, textTransform: 'uppercase' }}>
                  Select Size
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {pieceSizes.map(size => {
                    const selected = selectedSize === size
                    const unitsForSize = (piece.availableUnits ?? []).filter(u => u.size === size)
                    const stockCount = unitsForSize.length
                    const allNew = stockCount > 0 && unitsForSize.every(u => u.wear_count === 0)
                    return (
                      <Pressable
                        key={size}
                        onPress={() => handleSizeChange(size)}
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
                          color: selected ? colors.cream + 'BB' : (allNew ? colors.success : colors.slate),
                        }}>
                          {stockCount > 0 ? (allNew ? `${stockCount} pristine` : `${stockCount} in stock`) : '—'}
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

          </View>
        )}

        {/* Condition tier picker — shown when the selected size has both pristine and worn units */}
        {selectedSize && hasChoice && piece.is_available && (
          <View style={{ gap: 10 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy, letterSpacing: 0.2, textTransform: 'uppercase' }}>
              Select Condition
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {/* Pristine option */}
              <Pressable
                onPress={() => setConditionPref('pristine')}
                style={{
                  flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 4,
                  backgroundColor: conditionPref === 'pristine' ? colors.navy : colors.white,
                  borderColor:     conditionPref === 'pristine' ? colors.navy : colors.sand + 'CC',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: conditionPref === 'pristine' ? colors.cream : colors.success }} />
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 13, color: conditionPref === 'pristine' ? colors.cream : colors.navy }}>
                    Pristine
                  </Text>
                </View>
                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: conditionPref === 'pristine' ? colors.cream : colors.navy }}>
                  {formatCentsPerMonth(pristineFeeCents)}
                </Text>
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 10, color: conditionPref === 'pristine' ? colors.sand : colors.slate }}>
                  {pristineUnits.length} unit{pristineUnits.length !== 1 ? 's' : ''} · tags attached
                </Text>
              </Pressable>

              {/* Worn option */}
              <Pressable
                onPress={() => setConditionPref('worn')}
                style={{
                  flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 4,
                  backgroundColor: conditionPref === 'worn' ? colors.navy : colors.white,
                  borderColor:     conditionPref === 'worn' ? colors.navy : colors.sand + 'CC',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: conditionPref === 'worn' ? colors.cream : colors.navy }} />
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 13, color: conditionPref === 'worn' ? colors.cream : colors.navy }}>
                    {wearTierLabel(minWornWear)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: conditionPref === 'worn' ? colors.cream : colors.navy }}>
                    {formatCentsPerMonth(wornFeeCents)}
                  </Text>
                  {wornFeeCents < pristineFeeCents && (
                    <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: conditionPref === 'worn' ? colors.sand : colors.success }}>
                      save {formatCents(pristineFeeCents - wornFeeCents)}/mo
                    </Text>
                  )}
                </View>
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 10, color: conditionPref === 'worn' ? colors.sand : colors.slate }}>
                  {wornUnits.length} unit{wornUnits.length !== 1 ? 's' : ''} · dry cleaned
                </Text>
              </Pressable>
            </View>
            {!conditionPref && (
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate + 'AA' }}>
                Pick a condition above — we'll match you to that unit.
              </Text>
            )}
          </View>
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

        <View style={{ height: insets.bottom + 100 }} />
      </View>
      </ScrollView>

      {/* Sticky Add to Suitcase bar — always reachable without scrolling */}
      {piece.is_available && pieceSizes.length > 0 && (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: colors.cream,
          borderTopWidth: 1, borderTopColor: colors.sand + '55',
          paddingHorizontal: layout.screenPadding,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          gap: 10,
        }}>
          {alreadyInSuitcase ? (
            <Pressable
              onPress={() => router.push('/(tabs)/suitcase' as any)}
              style={{ backgroundColor: colors.sand + '40', borderRadius: 14, padding: 17, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
            >
              <Ionicons name="checkmark-circle" size={18} color={colors.navy} />
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 16, color: colors.navy }}>In Your Suitcase · View</Text>
            </Pressable>
          ) : !session ? (
            <Pressable
              onPress={() => router.push('/(auth)/signup' as any)}
              style={{ backgroundColor: colors.accent, borderRadius: 14, padding: 17, alignItems: 'center' }}
            >
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 16, color: colors.cream }}>
                Sign Up to Rent · {formatCentsPerMonth(piece.rental_fee)}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleAddToSuitcase}
              disabled={!selectedSize || (hasChoice && !conditionPref)}
              style={{
                backgroundColor: (selectedSize && (!hasChoice || conditionPref)) ? colors.navy : colors.sand + '60',
                borderRadius: 14, padding: 17, alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 16, color: (selectedSize && (!hasChoice || conditionPref)) ? colors.cream : colors.slate }}>
                {!selectedSize
                  ? 'Select a Size to Continue'
                  : (hasChoice && !conditionPref)
                    ? 'Choose a Condition Above'
                    : `Add to Suitcase · ${formatCentsPerMonth(effectiveFeeCents)}`}
              </Text>
            </Pressable>
          )}

          {/* Save to Plan — secondary CTA, only shown when trips feature is on and user is signed in */}
          {tripsEnabled && session && (
            <Pressable
              onPress={() => {
                if (!selectedSize) return
                setShowTripPicker(true)
              }}
              disabled={!selectedSize}
              style={{
                borderWidth: 1.5,
                borderColor: selectedSize ? colors.navy + '50' : colors.sand + '60',
                borderRadius: 14, paddingVertical: 12,
                alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 7,
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={15}
                color={selectedSize ? colors.navy : colors.gray400}
              />
              <Text style={{
                fontFamily: 'Inter-Medium', fontSize: 14,
                color: selectedSize ? colors.navy : colors.gray400,
              }}>
                {selectedSize ? 'Save to Plan' : 'Select a Size First'}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {tripsEnabled && session && piece && selectedSize && (
        <TripPickerSheet
          visible={showTripPicker}
          onClose={() => setShowTripPicker(false)}
          userId={session.user.id}
          piece={piece}
          size={selectedSize}
        />
      )}
    </View>
  )
}
