import { useCallback, useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useSuitcaseStore, useSuitcaseHydrated } from '@/store/suitcaseStore'
import { useAuthStore } from '@/store/authStore'
import { useSuitcaseRemove } from '@/hooks/useSuitcaseRemove'
import { multiPieceDiscount } from '@/utils/pricing'
import { SuitcaseItemRow } from '@/components/suitcase/SuitcaseItemRow'
import { SuitcaseSummary } from '@/components/suitcase/SuitcaseSummary'
import { SuitcaseSkeleton } from '@/components/ui/Skeleton'
import { supabase } from '@/lib/supabase'
import { colors } from '@/constants/colors'
import { layout } from '@/constants/layout'
import { DEPOSIT_CENTS, HANDLING_CENTS } from '@/constants/billing'

function nextDiscountTier(count: number): { add: number; pct: number } | null {
  if (count < 2) return { add: 2 - count, pct: 8 }
  if (count < 3) return { add: 1, pct: 18 }
  if (count < 5) return { add: 5 - count, pct: 25 }
  if (count < 7) return { add: 7 - count, pct: 30 }
  return null
}

export default function SuitcaseScreen() {
  const { items, monthlyTotalCents } = useSuitcaseStore()
  const removeItem = useSuitcaseRemove()
  const hydrated = useSuitcaseHydrated()
  const { session, profile } = useAuthStore()
  const queryClient = useQueryClient()
  const insets = useSafeAreaInsets()
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set())

  const hasDepositOnFile = profile?.deposit_status === 'held'
  const count = items.length
  const rawMonthly = monthlyTotalCents()
  const nextTier = nextDiscountTier(count)
  const currentDiscount = multiPieceDiscount(count)

  useFocusEffect(useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['pieces'] })
    const pieceIds = useSuitcaseStore.getState().items.map(i => i.piece_id)
    if (!pieceIds.length) return
    supabase
      .from('pieces')
      .select('id, is_available')
      .in('id', pieceIds)
      .then(({ data }) => {
        if (!data) return
        setUnavailableIds(new Set(data.filter(p => !p.is_available).map(p => p.id)))
      })
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
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 28, color: colors.navy, textAlign: 'center', marginBottom: 8 }}>
          Your suitcase is empty
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.slate, textAlign: 'center', lineHeight: 22, marginBottom: 28 }}>
          Add pieces from the wardrobe to start your monthly rental.
        </Text>
        <Pressable
          onPress={() => router.push('/(tabs)/pieces')}
          accessibilityLabel="Browse all pieces"
          accessibilityRole="button"
          style={{ backgroundColor: colors.navy, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 16 }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 16, color: colors.cream }}>
            Browse All Pieces →
          </Text>
        </Pressable>
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
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: layout.screenPadding, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 28, color: colors.navy }}>
            Your Suitcase
          </Text>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, marginTop: 2 }}>
            {count} piece{count !== 1 ? 's' : ''}
            {currentDiscount > 0 ? ` · ${Math.round(currentDiscount * 100)}% bundle discount active` : ''}
          </Text>
        </View>

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
          style={{ marginTop: 16, backgroundColor: colors.navy, borderRadius: 14, padding: 18, alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 17, color: colors.cream }}>
            {session ? 'Proceed to Checkout →' : 'Sign In to Checkout →'}
          </Text>
        </Pressable>

        {session && (
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate, textAlign: 'center', marginTop: 10, lineHeight: 18 }}>
            No commitment — swap or return pieces anytime.
          </Text>
        )}
      </ScrollView>
    </View>
  )
}
