import { useCallback, useState, useRef } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Image } from 'expo-image'
import { useSuitcaseStore, useSuitcaseHydrated } from '@/store/suitcaseStore'
import { useTabBarStore } from '@/store/tabBarStore'
import { useAuthStore } from '@/store/authStore'
import { useSuitcaseRemove } from '@/hooks/useSuitcaseRemove'
import { usePendingReviews, type PendingReview } from '@/hooks/useReviews'
import { multiPieceDiscount } from '@/utils/pricing'
import { SuitcaseItemRow } from '@/components/suitcase/SuitcaseItemRow'
import { SuitcaseSummary } from '@/components/suitcase/SuitcaseSummary'
import { SuitcaseSkeleton } from '@/components/ui/Skeleton'
import { ReviewModal } from '@/components/reviews/ReviewModal'
import { supabase } from '@/lib/supabase'
import { colors } from '@/constants/colors'
import { layout, DEFAULT_BLURHASH } from '@/constants/layout'
import { DEPOSIT_CENTS, HANDLING_CENTS } from '@/constants/billing'
import { useTripsEnabled } from '@/hooks/useAppSettings'

function nextDiscountTier(count: number): { add: number; pct: number } | null {
  if (count < 2) return { add: 2 - count, pct: 8 }
  if (count < 3) return { add: 1, pct: 18 }
  if (count < 5) return { add: 5 - count, pct: 25 }
  if (count < 7) return { add: 7 - count, pct: 30 }
  return null
}

export default function SuitcaseScreen() {
  const { items, monthlyTotalCents } = useSuitcaseStore()
  const setScrolledDown = useTabBarStore(s => s.setScrolledDown)
  const lastScrollY = useRef(0)
  const removeItem = useSuitcaseRemove()
  const hydrated = useSuitcaseHydrated()
  const { session, profile } = useAuthStore()
  const queryClient = useQueryClient()
  const insets = useSafeAreaInsets()
  const tripsEnabled = useTripsEnabled()
  const [unavailableIds, setUnavailableIds]   = useState<Set<string>>(new Set())
  const [reviewTarget,   setReviewTarget]     = useState<PendingReview | null>(null)

  const { data: pendingReviews = [] } = usePendingReviews(session?.user.id)

  const hasDepositOnFile = profile?.deposit_status === 'held'
  const count = items.length
  const rawMonthly = monthlyTotalCents()
  // Include existing active rentals so returning customers see the correct tier.
  // active_rental_count reflects pieces they already have; the new suitcase items are additive.
  const existingCount = profile?.active_rental_count ?? 0
  const totalCount = existingCount + count
  const nextTier = nextDiscountTier(totalCount)
  const currentDiscount = multiPieceDiscount(totalCount)

  useFocusEffect(useCallback(() => {
    const pieceIds = useSuitcaseStore.getState().items.map(i => i.piece_id)
    if (!pieceIds.length) return
    queryClient.invalidateQueries({ queryKey: ['pieces'] })
    let cancelled = false
    supabase
      .from('pieces')
      .select('id, is_available')
      .in('id', pieceIds)
      .then(({ data }) => {
        if (cancelled || !data) return
        setUnavailableIds(new Set(data.filter(p => !p.is_available).map(p => p.id)))
      })
    return () => { cancelled = true }
  }, [queryClient]))

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: insets.top }}>
        <SuitcaseSkeleton />
      </View>
    )
  }

  if (count === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', padding: layout.screenPadding }}>
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 28, color: colors.navy, textAlign: 'center', marginBottom: 10, letterSpacing: 0.2 }}>
          Your suitcase is empty
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.slate, textAlign: 'center', lineHeight: 23, marginBottom: 32 }}>
          Browse pieces and add them to your suitcase to start your rental.
        </Text>
        <Pressable
          onPress={() => router.push('/(tabs)/pieces')}
          accessibilityLabel="Browse all pieces"
          accessibilityRole="button"
          style={{ backgroundColor: colors.navy, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 16 }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 16, color: colors.cream, letterSpacing: 0.2 }}>
            Browse All Pieces →
          </Text>
        </Pressable>
        {tripsEnabled && (
          <Pressable
            onPress={() => router.push('/trip/new' as any)}
            accessibilityLabel="Create a plan instead"
            accessibilityRole="button"
            style={{ marginTop: 12, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, borderWidth: 1, borderColor: colors.sand + 'AA' }}
          >
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.slate, textAlign: 'center' }}>
              Planning for an event? Create a plan →
            </Text>
          </Pressable>
        )}
        {!session && (
          <Pressable onPress={() => router.push('/(auth)/login' as any)} style={{ marginTop: 16, padding: 8 }}>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate }}>
              Already a member?{' '}
              <Text style={{ color: colors.navy, fontFamily: 'Inter-Medium' }}>Sign in</Text>
            </Text>
          </Pressable>
        )}
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: layout.screenPadding, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={e => {
          const y = e.nativeEvent.contentOffset.y
          setScrolledDown(y > lastScrollY.current && y > 60)
          lastScrollY.current = y
        }}>

        {/* Header */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 28, color: colors.navy, letterSpacing: 0.2 }}>
            Your Suitcase
          </Text>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, marginTop: 3, lineHeight: 20 }}>
            {count} piece{count !== 1 ? 's' : ''}
            {currentDiscount > 0 ? ` · ${Math.round(currentDiscount * 100)}% bundle discount active` : ''}
          </Text>
        </View>

        {/* Max bundle discount unlocked */}
        {!nextTier && currentDiscount > 0 && (
          <Animated.View entering={FadeInDown.springify()} style={{
            backgroundColor: colors.success + '15',
            borderRadius: 12, padding: 12,
            flexDirection: 'row', alignItems: 'center', gap: 8,
            marginBottom: 16, borderWidth: 1, borderColor: colors.success + '30',
          }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.success }}>
              {Math.round(currentDiscount * 100)}% bundle discount unlocked
            </Text>
          </Animated.View>
        )}

        {/* "Add X more to unlock Y% off" banner */}
        {nextTier && (
          <Animated.View entering={FadeInDown.springify()} style={{
            backgroundColor: colors.navy + '0D',
            borderRadius: 12, padding: 12,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16, borderWidth: 1, borderColor: colors.navy + '20',
          }}>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.navy, flex: 1, lineHeight: 18 }}>
              Add {nextTier.add} more piece{nextTier.add !== 1 ? 's' : ''} to unlock{' '}
              <Text style={{ fontFamily: 'Inter-Medium' }}>{nextTier.pct}% off</Text> everything
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/pieces')}
              accessibilityLabel="Browse pieces to unlock discount"
              accessibilityRole="button"
              style={{ backgroundColor: colors.navy, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, marginLeft: 10 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: colors.cream }}>Browse</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Item rows */}
        {items.map((item, i) => (
          <Animated.View key={`${item.piece_id}-${item.size}`} entering={FadeInDown.delay(i * 40).springify()}>
            <SuitcaseItemRow
              item={item}
              onRemove={removeItem}
              unavailable={unavailableIds.has(item.piece_id)}
            />
          </Animated.View>
        ))}

        {/* Pricing summary */}
        <View style={{ marginTop: 8 }}>
          <SuitcaseSummary
            itemCount={count}
            discountPieceCount={totalCount}
            rawMonthlyCents={rawMonthly}
            hasDepositOnFile={hasDepositOnFile}
            handlingFeeCents={HANDLING_CENTS}
            depositCents={DEPOSIT_CENTS}
          />
        </View>

        {/* Checkout CTA */}
        <Pressable
          onPress={() => {
            if (!session) { router.push('/(auth)/login' as any); return }
            router.push('/checkout' as any)
          }}
          accessibilityLabel={session ? 'Proceed to checkout' : 'Sign in to checkout'}
          accessibilityRole="button"
          style={{ marginTop: 20, backgroundColor: colors.navy, borderRadius: 14, padding: 18, alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 17, color: colors.cream, letterSpacing: 0.2 }}>
            {session ? 'Proceed to Checkout →' : 'Sign In to Checkout →'}
          </Text>
        </Pressable>

        {session && (
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate, textAlign: 'center', marginTop: 12, lineHeight: 18, letterSpacing: 0.1 }}>
            First month billed upfront. Return or swap anytime after.
          </Text>
        )}

        {/* Pending reviews */}
        {pendingReviews.length > 0 && (
          <Animated.View entering={FadeInDown.springify()} style={{ marginTop: 28, gap: 12 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.slate, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              How did it go?
            </Text>
            {pendingReviews.map(pr => (
              <Pressable
                key={pr.rental_id}
                onPress={() => setReviewTarget(pr)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  backgroundColor: colors.white, borderRadius: 16, padding: 14,
                  borderWidth: 1, borderColor: colors.sand + '90',
                  shadowColor: colors.navy, shadowOpacity: 0.05, shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                }}
              >
                {pr.piece_image && (
                  <Image
                    source={pr.piece_image}
                    style={{ width: 52, height: 52, borderRadius: 10 }}
                    contentFit="cover"
                    placeholder={DEFAULT_BLURHASH}
                  />
                )}
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: colors.slate, textTransform: 'uppercase', letterSpacing: 1.2 }}>
                    {pr.piece_brand}
                  </Text>
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: colors.navy }} numberOfLines={1}>
                    {pr.piece_name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                    {[1,2,3,4,5].map(n => (
                      <Ionicons key={n} name="star-outline" size={11} color={colors.accent} />
                    ))}
                    <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.accent, marginLeft: 4 }}>
                      Leave a review →
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </Animated.View>
        )}

      </ScrollView>

      {reviewTarget && session && (
        <ReviewModal
          visible={!!reviewTarget}
          rentalId={reviewTarget.rental_id}
          pieceId={reviewTarget.piece_id}
          userId={session.user.id}
          pieceName={reviewTarget.piece_name}
          pieceBrand={reviewTarget.piece_brand}
          pieceImage={reviewTarget.piece_image}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </View>
  )
}
