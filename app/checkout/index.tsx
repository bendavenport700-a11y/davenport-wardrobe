import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator, BackHandler, Platform } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useStripe } from '@/lib/stripe'
import { callEdgeFunction } from '@/lib/supabase'
import { useSuitcaseStore, useSuitcaseHydrated } from '@/store/suitcaseStore'
import { useSuitcaseRemove } from '@/hooks/useSuitcaseRemove'
import { useAuthStore } from '@/store/authStore'
import { SuitcaseItemRow } from '@/components/suitcase/SuitcaseItemRow'
import { SuitcaseSummary } from '@/components/suitcase/SuitcaseSummary'
import { SuitcaseSkeleton } from '@/components/ui/Skeleton'
import { DepositExplainer } from '@/components/checkout/DepositExplainer'
import { friendlyError } from '@/utils/errors'
import { formatCents } from '@/utils/format'
import { colors } from '@/constants/colors'
import { layout } from '@/constants/layout'
import { DEPOSIT_CENTS, HANDLING_CENTS } from '@/constants/billing'

type CheckoutStatus = 'idle' | 'loading' | 'processing'

interface SetupIntentResponse {
  client_secret: string
  setup_intent_id: string
  customer_id: string
  ephemeral_key_secret: string
}

export default function CheckoutScreen() {
  const { items, monthlyTotalCents, clearSuitcase } = useSuitcaseStore()
  const removeItem = useSuitcaseRemove()
  const hydrated = useSuitcaseHydrated()
  const { session, profile } = useAuthStore()
  const insets = useSafeAreaInsets()
  const { initPaymentSheet, presentPaymentSheet } = useStripe()

  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const hasPaymentOnFile  = !!profile?.stripe_payment_method_id
  const hasDepositOnFile  = profile?.deposit_status === 'held'
  const hasShippingAddress = !!profile?.shipping_address
  const rawMonthly = monthlyTotalCents()
  const count = items.length
  const isProcessing = checkoutStatus !== 'idle'

  // Redirect guards — run in a single effect to avoid competing redirects.
  // Guard count===0 with checkoutStatus==='idle' so clearSuitcase() called after a
  // successful payment doesn't race against the confirmation navigation.
  useEffect(() => {
    if (!hydrated) return
    if (!session) {
      router.replace('/(auth)/login' as any)
      return
    }
    if (count === 0 && checkoutStatus === 'idle') {
      router.replace('/(tabs)/suitcase' as any)
    }
  }, [hydrated, session, count, checkoutStatus])

  // Android: block hardware back button during payment processing
  useEffect(() => {
    if (Platform.OS !== 'android') return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => isProcessing)
    return () => sub.remove()
  }, [isProcessing])

  const buildOrderItems = () =>
    useSuitcaseStore.getState().items.map(item => ({
      piece_id:              item.piece_id,
      size:                  item.size,
      rental_fee_cents:      item.rental_fee_cents,
      wear_count_at_rental:  item.piece.wear_count,
      buyout_price_snapshot: item.piece.buyout_price,
    }))

  // Path A — new customer: collect card via Payment Sheet, then charge
  const handleNewCustomer = async () => {
    setCheckoutStatus('loading')
    setError(null)
    try {
      const si = await callEdgeFunction<SetupIntentResponse>('create-setup-intent')

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName:       'Davenport',
        setupIntentClientSecret:   si.client_secret,
        customerId:                si.customer_id,
        customerEphemeralKeySecret: si.ephemeral_key_secret,
        style:                     'automatic',
        appearance: { colors: { primary: colors.navy, background: colors.cream } },
      } as any)
      if (initError) throw new Error(initError.message)

      const { error: sheetError } = await presentPaymentSheet()
      if (sheetError) {
        if ((sheetError as any).code === 'Canceled') { setCheckoutStatus('idle'); return }
        throw new Error((sheetError as { message: string }).message)
      }

      setCheckoutStatus('processing')
      const { order_id } = await callEdgeFunction<{ order_id: string }>('confirm-order', {
        setup_intent_id: si.setup_intent_id,
        items: buildOrderItems(),
      })

      clearSuitcase()
      router.replace({ pathname: '/checkout/confirmation', params: { order_id } } as any)
    } catch (err) {
      setError(friendlyError(err))
      setCheckoutStatus('idle')
    }
  }

  // Path B — returning customer: charge saved card directly
  const handleReturningCustomer = async () => {
    setCheckoutStatus('processing')
    setError(null)
    // Generate a per-attempt idempotency key so a network retry can't double-charge.
    const idempotency_key = crypto.randomUUID()
    try {
      const { order_id } = await callEdgeFunction<{ order_id: string }>('confirm-order', {
        items: buildOrderItems(),
        idempotency_key,
      })
      clearSuitcase()
      router.replace({ pathname: '/checkout/confirmation', params: { order_id } } as any)
    } catch (err) {
      setError(friendlyError(err))
      setCheckoutStatus('idle')
    }
  }

  // Show skeleton while hydrating or before redirect effects fire
  if (!hydrated || !session) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: insets.top }}>
        <SuitcaseSkeleton />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: layout.screenPadding,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Pressable
          onPress={() => router.back()}
          disabled={isProcessing}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={{ marginBottom: 20 }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.navy }}>← Back</Text>
        </Pressable>

        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 28, color: colors.navy, marginBottom: 4 }}>
          Review Order
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, marginBottom: 20 }}>
          {count} piece{count !== 1 ? 's' : ''} · confirm before charging
        </Text>

        {/* Item list — remove disabled while payment is processing */}
        {items.map(item => (
          <SuitcaseItemRow
            key={`${item.piece_id}-${item.size}`}
            item={item}
            onRemove={removeItem}
            removeDisabled={isProcessing}
          />
        ))}

        {/* Pricing summary */}
        <View style={{ marginTop: 8, marginBottom: 16 }}>
          <SuitcaseSummary
            itemCount={count}
            rawMonthlyCents={rawMonthly}
            hasDepositOnFile={hasDepositOnFile}
            handlingFeeCents={HANDLING_CENTS}
            depositCents={DEPOSIT_CENTS}
          />
        </View>

        {/* Deposit explainer */}
        <View style={{ marginBottom: 16 }}>
          <DepositExplainer depositCents={DEPOSIT_CENTS} hasDepositOnFile={hasDepositOnFile} />
        </View>

        {/* Error */}
        {error && (
          <View style={{
            backgroundColor: colors.error + '15', borderRadius: 12,
            padding: 14, marginBottom: 16,
          }}>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.error, lineHeight: 20 }}>
              {error}
            </Text>
          </View>
        )}

        {/* Shipping address guard — profile should always have one here, but show
            a clear error if something went wrong rather than letting confirm-order fail */}
        {profile && !profile.shipping_address && (
          <View style={{
            backgroundColor: colors.warning + '20', borderRadius: 12,
            padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.warning + '40',
          }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.gray700, marginBottom: 4 }}>
              Shipping address required
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, marginBottom: 10 }}>
              Add a shipping address to your account before checking out.
            </Text>
            <Pressable
              onPress={() => router.push('/(auth)/complete-profile' as any)}
              style={{ backgroundColor: colors.navy, borderRadius: 10, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.cream }}>Add Address →</Text>
            </Pressable>
          </View>
        )}

        {/* Pay button */}
        {hasPaymentOnFile ? (
          // Path B — returning customer
          <View style={{ gap: 8 }}>
            <Pressable
              onPress={handleReturningCustomer}
              disabled={isProcessing || !hasShippingAddress}
              accessibilityLabel="Confirm and pay"
              accessibilityRole="button"
              style={{
                backgroundColor: isProcessing ? colors.gray200 : colors.navy,
                borderRadius: 14, padding: 18,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
              {isProcessing && <ActivityIndicator size="small" color={colors.cream} />}
              <Text style={{
                fontFamily: 'Inter-Medium', fontSize: 17,
                color: isProcessing ? colors.gray400 : colors.cream,
              }}>
                {isProcessing ? 'Processing…' : 'Confirm & Pay →'}
              </Text>
            </Pressable>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate, textAlign: 'center' }}>
              Charged to your saved card · cancel anytime after 30 days
            </Text>
          </View>
        ) : (
          // Path A — new customer
          <View style={{ gap: 8 }}>
            <Pressable
              onPress={handleNewCustomer}
              disabled={isProcessing || !hasShippingAddress}
              accessibilityLabel="Set up payment and pay"
              accessibilityRole="button"
              style={{
                backgroundColor: isProcessing ? colors.gray200 : colors.navy,
                borderRadius: 14, padding: 18,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
              {isProcessing && <ActivityIndicator size="small" color={colors.cream} />}
              <Text style={{
                fontFamily: 'Inter-Medium', fontSize: 17,
                color: isProcessing ? colors.gray400 : colors.cream,
              }}>
                {checkoutStatus === 'processing' ? 'Processing…'
                  : checkoutStatus === 'loading' ? 'Loading…'
                  : 'Set Up Payment & Pay →'}
              </Text>
            </Pressable>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate, textAlign: 'center' }}>
              Secured by Stripe · {formatCents(DEPOSIT_CENTS)} deposit held, not charged · cancel anytime after 30 days
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
