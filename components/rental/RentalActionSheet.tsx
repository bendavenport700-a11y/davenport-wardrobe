import { View, Text, Pressable, ActivityIndicator, Linking, Alert, Modal, StyleSheet, ScrollView } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated'
import { useEffect, useRef, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { callEdgeFunction } from '@/lib/supabase'
import { colors } from '@/constants/colors'
import { DEFAULT_BLURHASH } from '@/constants/layout'
import { formatCents, formatCentsPerMonth, formatDate } from '@/utils/format'
import { LOYALTY_BUYOUT_BONUS_MONTHS } from '@/utils/pricing'
import type { Rental, Piece } from '@/types'

export type RentalWithPiece = Rental & { piece?: Piece }

interface RentalActionSheetProps {
  visible: boolean
  onClose: () => void
  rental: RentalWithPiece | null
  userId: string
}

function rentalMonths(createdAt: string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000))
}

function daysSince(createdAt: string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
}

function daysUntilDate(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

export function RentalActionSheet({ visible, onClose, rental, userId }: RentalActionSheetProps) {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const [buyoutLoading, setBuyoutLoading] = useState(false)
  const [returnLoading, setReturnLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Cache the last non-null rental so the close animation can finish rendering
  // even after the parent sets rental=null when onClose() is called.
  const rentalRef = useRef(rental)
  if (rental) rentalRef.current = rental

  const translateY = useSharedValue(700)
  const backdropOpacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      translateY.value = withSpring(0, { damping: 26, stiffness: 300 })
      backdropOpacity.value = withTiming(1, { duration: 200 })
    } else if (mounted) {
      translateY.value = withTiming(700, {
        duration: 240,
        easing: Easing.in(Easing.quad),
      }, (finished) => {
        if (finished) runOnJS(setMounted)(false)
      })
      backdropOpacity.value = withTiming(0, { duration: 200 })
    }
  }, [visible])

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }))
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }))

  if (!mounted || !rentalRef.current) return null

  const r = rentalRef.current
  const piece = r.piece
  const months = rentalMonths(r.created_at)
  const days = daysSince(r.created_at)
  const minDays = r.min_rental_days ?? 30
  const isEarlyReturn = days < minDays
  const daysToMinimum = Math.max(0, minDays - days)
  const nextBillingDays = daysUntilDate(r.next_billing_date ?? null)
  const nextBillingLabel = r.next_billing_date ? formatDate(r.next_billing_date) : null
  const isLoyalty = months >= LOYALTY_BUYOUT_BONUS_MONTHS
  const buyoutPrice = isLoyalty
    ? Math.round((r.buyout_price_snapshot ?? 0) * 0.95)
    : (r.buyout_price_snapshot ?? 0)

  const isDelivered = r.status === 'delivered'
  const isReturnRequested = r.status === 'return_requested'
  const isInTransit = ['pending', 'sourcing', 'shipped'].includes(r.status)

  // Buyout: allowed at any active stage except return_requested / bought_out
  const canBuyout = r.billing_active && !r.bought_out && buyoutPrice > 0 && !isReturnRequested

  // Return: allowed any time after delivery (or even during transit so customer can decide early)
  const canReturn = (isDelivered || isInTransit) && !r.bought_out && !isReturnRequested

  const pieceName = [piece?.brand, piece?.name].filter(Boolean).join(' ')

  // Context-sensitive sublabel for the Return action card
  function returnSubLabel(): string {
    if (!isDelivered && isInTransit) return 'Pre-delivery option'
    if (isEarlyReturn) return `${daysToMinimum}d left on minimum`
    if (nextBillingDays !== null && nextBillingDays <= 5) return `Bill in ${nextBillingDays}d — act now`
    if (nextBillingLabel) return `Return before ${nextBillingLabel}`
    return 'Billing stops now'
  }

  // Context-sensitive confirmation message
  function returnConfirmMessage(): string {
    if (!isDelivered && isInTransit) {
      return `Request a return now and we'll send the label — no need to wait for delivery. Billing stops immediately. Ship back within 21 days of receiving the piece.`
    }
    if (isEarlyReturn) {
      return `You're ${daysToMinimum} day${daysToMinimum !== 1 ? 's' : ''} before your 30-day minimum. Billing stops now — your first month's payment already covers this period. We'll email a prepaid label within 24 hours.`
    }
    if (nextBillingDays !== null && nextBillingDays <= 5) {
      return `Your next charge of ${formatCentsPerMonth(r.rental_fee_cents)} is in ${nextBillingDays} day${nextBillingDays !== 1 ? 's' : ''}. Return now to avoid it — billing stops the moment you confirm. Prepaid label arrives within 24 hours.`
    }
    return `Billing stops immediately. We'll email a prepaid return label within 24 hours. Ship back within 21 days.`
  }

  async function handleBuyout() {
    const preDelivery = !isDelivered && isInTransit
    const confirmMsg = preDelivery
      ? `${pieceName || 'This piece'}: ${formatCents(buyoutPrice)} charged now. Billing stops and the piece is yours — no return needed when it arrives.`
      : `${pieceName || 'This piece'}: ${formatCents(buyoutPrice)} charged to your card on file. Billing stops immediately.`
    Alert.alert(
      'Buy This Piece',
      confirmMsg,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Buy for ${formatCents(buyoutPrice)}`,
          onPress: async () => {
            setBuyoutLoading(true)
            try {
              await callEdgeFunction('process-buyout', { rental_id: r.id })
              await queryClient.invalidateQueries({ queryKey: ['rentals', 'active', userId] })
              onClose()
              Alert.alert('Purchase Complete', `${piece?.name ?? 'This piece'} is now yours. Billing stopped.`)
            } catch (err: any) {
              Alert.alert('Purchase Failed', err.message ?? 'Something went wrong.')
            } finally {
              setBuyoutLoading(false)
            }
          },
        },
      ]
    )
  }

  async function handleReturn() {
    Alert.alert(
      'Request Return',
      returnConfirmMessage(),
      [
        { text: 'Keep It', style: 'cancel' },
        {
          text: 'Request Return',
          style: 'destructive',
          onPress: async () => {
            setReturnLoading(true)
            try {
              await callEdgeFunction('request-return', { rental_id: r.id })
              await queryClient.invalidateQueries({ queryKey: ['rentals', 'active', userId] })
              onClose()
              Alert.alert(
                'Return Requested',
                "We'll email a prepaid return label within 24 hours. Please ship back within 21 days."
              )
            } catch (err: any) {
              Alert.alert('Could Not Process Return', err.message ?? 'Something went wrong.')
            } finally {
              setReturnLoading(false)
            }
          },
        },
      ]
    )
  }

  function handleSizeSwap() {
    const subject = encodeURIComponent(`Size Swap – ${pieceName || 'My Rental'}`)
    const body = encodeURIComponent(
      `Hi,\n\nI'd like to try a different size on my rental.\n\nPiece: ${pieceName}\nCurrent size: ${r.size}\nRental ID: ${r.id}\n\nRequested size: \n\nThanks!`
    )
    Linking.openURL(`mailto:support@davenport.rentals?subject=${subject}&body=${body}`)
  }

  function handleSwap() {
    onClose()
    setTimeout(() => router.push('/(tabs)/pieces' as any), 280)
  }

  function handleViewPiece() {
    if (!piece) return
    onClose()
    setTimeout(() => router.push({ pathname: '/piece/[id]', params: { id: piece.id } } as any), 280)
  }

  return (
    <Modal
      transparent
      visible={mounted}
      onRequestClose={onClose}
      statusBarTranslucent
      animationType="none"
    >
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.ink + 'A6' }, backdropStyle]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>

        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* Drag handle */}
          <View style={styles.handle}>
            <View style={styles.handleBar} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
          >
            {/* Hero: piece image + info */}
            <View style={styles.hero}>
              {piece?.images?.[0] ? (
                <Image
                  source={piece.images[0]}
                  placeholder={DEFAULT_BLURHASH}
                  style={styles.heroImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.heroImage, styles.heroImageFallback]}>
                  <Text style={styles.heroImageFallbackText}>D</Text>
                </View>
              )}
              <View style={styles.heroInfo}>
                {piece?.brand && (
                  <Text style={styles.heroBrand}>{piece.brand.toUpperCase()}</Text>
                )}
                <Text style={styles.heroName} numberOfLines={2}>
                  {piece?.name ?? 'Your Rental'}
                </Text>
                <Text style={styles.heroMeta}>
                  Size {r.size}{'  ·  '}{formatCentsPerMonth(r.rental_fee_cents)}
                </Text>
                {months > 0 && (
                  <View style={styles.heroPill}>
                    <Text style={styles.heroPillText}>
                      {months} month{months !== 1 ? 's' : ''} rented
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Urgent billing warning — shown when next charge is ≤3 days away */}
            {isDelivered && !isReturnRequested && nextBillingDays !== null && nextBillingDays <= 3 && (
              <View style={styles.urgentBanner}>
                <Ionicons name="alert-circle" size={16} color={colors.warning} />
                <Text style={styles.urgentText}>
                  Next charge in {nextBillingDays === 0 ? 'less than a day' : `${nextBillingDays} day${nextBillingDays !== 1 ? 's' : ''}`}
                  {' '}— return now to avoid it.
                </Text>
              </View>
            )}

            {/* Buyout card */}
            {canBuyout && (
              <Pressable onPress={handleBuyout} disabled={buyoutLoading} style={styles.buyoutCard}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text style={styles.buyoutTitle}>Buy this piece</Text>
                    {isLoyalty && (
                      <View style={styles.loyalBadge}>
                        <Text style={styles.loyalBadgeText}>LOYAL</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.buyoutSub}>
                    {isLoyalty ? '5% loyalty discount applied' :
                     isInTransit ? 'Own it before it arrives. No return needed.' :
                     'Billing stops immediately. Yours to keep.'}
                  </Text>
                </View>
                {buyoutLoading ? (
                  <ActivityIndicator color={colors.cream} size="small" />
                ) : (
                  <View style={styles.buyoutPriceBox}>
                    <Text style={styles.buyoutPrice}>{formatCents(buyoutPrice)}</Text>
                    <Text style={styles.buyoutPriceSub}>buy now</Text>
                  </View>
                )}
              </Pressable>
            )}

            {/* Return requested state */}
            {isReturnRequested && (
              <View style={styles.returnRequestedCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={styles.returnRequestedTitle}>Return in progress</Text>
                </View>
                <Text style={styles.returnRequestedSub}>
                  Your prepaid return label is on its way. Pack securely and ship within 21 days. Your deposit is released once we receive the piece.
                </Text>
                <Pressable onPress={() => Linking.openURL('mailto:support@davenport.rentals')} style={{ marginTop: 4 }}>
                  <Text style={styles.returnRequestedLink}>Questions? Email us →</Text>
                </Pressable>
              </View>
            )}

            {/* Action grid — delivered or in-transit (customer may want to act before delivery) */}
            {!isReturnRequested && (isDelivered || isInTransit) && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Manage Rental</Text>
                <View style={styles.actionGrid}>

                  {/* Return */}
                  {canReturn && (
                    <Pressable
                      onPress={handleReturn}
                      disabled={returnLoading}
                      style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.7 }]}
                    >
                      {returnLoading ? (
                        <ActivityIndicator color={colors.navy} size="small" />
                      ) : (
                        <Ionicons name="arrow-undo-outline" size={20} color={colors.navy} />
                      )}
                      <Text style={styles.actionCardLabel}>Return</Text>
                      <Text style={styles.actionCardSub} numberOfLines={2}>
                        {returnSubLabel()}
                      </Text>
                    </Pressable>
                  )}

                  {/* Size swap — only after delivery */}
                  {isDelivered && (
                    <Pressable
                      onPress={handleSizeSwap}
                      style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.7 }]}
                    >
                      <Ionicons name="resize-outline" size={20} color={colors.navy} />
                      <Text style={styles.actionCardLabel}>Size Swap</Text>
                      <Text style={styles.actionCardSub}>We'll sort it out</Text>
                    </Pressable>
                  )}

                  {/* Swap piece */}
                  <Pressable
                    onPress={handleSwap}
                    style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.7 }]}
                  >
                    <Ionicons name="swap-horizontal-outline" size={20} color={colors.navy} />
                    <Text style={styles.actionCardLabel}>Swap Piece</Text>
                    <Text style={styles.actionCardSub}>Browse something new</Text>
                  </Pressable>

                  {/* View piece */}
                  {piece && (
                    <Pressable
                      onPress={handleViewPiece}
                      style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.7 }]}
                    >
                      <Ionicons name="eye-outline" size={20} color={colors.navy} />
                      <Text style={styles.actionCardLabel}>View Details</Text>
                      <Text style={styles.actionCardSub}>Photos & sizing</Text>
                    </Pressable>
                  )}
                </View>

                {/* Early return info note */}
                {isEarlyReturn && isDelivered && (
                  <View style={styles.infoNote}>
                    <Ionicons name="information-circle-outline" size={15} color={colors.slate} />
                    <Text style={styles.infoNoteText}>
                      Returning early? Billing stops now — your first month's payment already covers through day {minDays}.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* In-transit info card */}
            {isInTransit && (
              <View style={styles.inTransitBox}>
                <Ionicons
                  name={r.status === 'shipped' ? 'airplane-outline' : 'cube-outline'}
                  size={22}
                  color={colors.slate}
                />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.inTransitTitle}>
                    {r.status === 'shipped' ? 'On its way to you' : 'Being prepared'}
                  </Text>
                  <Text style={styles.inTransitSub}>
                    {r.status === 'pending' ? 'Order confirmed — ships in 1–2 weeks.' :
                     r.status === 'sourcing' ? 'Your piece ships in 1–2 weeks. Tracking comes via email.' :
                     r.tracking_number ? `${r.carrier ? r.carrier + ': ' : ''}${r.tracking_number}` :
                     'Tracking info will be emailed when it ships.'}
                  </Text>
                </View>
              </View>
            )}

            {/* Grace period reminder — past minimum, billing date is known */}
            {isDelivered && !isReturnRequested && !isEarlyReturn && nextBillingLabel && (
              <View style={styles.graceNote}>
                <Text style={styles.graceNoteText}>
                  Return before{' '}
                  <Text style={{ fontFamily: 'Inter-Medium', color: colors.navy }}>{nextBillingLabel}</Text>
                  {' '}to avoid your next billing cycle.
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.cream,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  handle: { alignItems: 'center', paddingTop: 12, paddingBottom: 6 },
  handleBar: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.sand + '80' },

  // Hero
  hero: {
    flexDirection: 'row', gap: 16,
    paddingHorizontal: 22, paddingTop: 12, paddingBottom: 22,
    borderBottomWidth: 1, borderBottomColor: colors.sand + '40',
  },
  heroImage: { width: 72, height: 90, borderRadius: 12 },
  heroImageFallback: {
    backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center',
  },
  heroImageFallbackText: { fontFamily: 'Inter-Bold', fontSize: 24, color: colors.cream },
  heroInfo: { flex: 1, justifyContent: 'center', gap: 5 },
  heroBrand: {
    fontFamily: 'Inter-Medium', fontSize: 10,
    color: colors.slate, letterSpacing: 1.2,
  },
  heroName: {
    fontFamily: 'Inter-Bold', fontSize: 18,
    color: colors.navy, letterSpacing: -0.4, lineHeight: 22,
  },
  heroMeta: { fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate },
  heroPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.sand + '50',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
    marginTop: 2,
  },
  heroPillText: { fontFamily: 'Inter-Medium', fontSize: 11, color: colors.slate },

  // Urgent billing banner
  urgentBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 22, marginTop: 14,
    backgroundColor: colors.warning + '18',
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: colors.warning + '35',
  },
  urgentText: { fontFamily: 'Inter-Medium', fontSize: 13, color: colors.navy, flex: 1, lineHeight: 18 },

  // Buyout
  buyoutCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 22, marginTop: 18,
    backgroundColor: colors.navy,
    borderRadius: 16, padding: 18, gap: 14,
  },
  buyoutTitle: { fontFamily: 'Inter-Bold', fontSize: 16, color: colors.cream, letterSpacing: -0.3 },
  buyoutSub: { fontFamily: 'Inter-Regular', fontSize: 12, color: colors.sand + 'CC' },
  loyalBadge: {
    backgroundColor: colors.sand + '25', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: colors.sand + '40',
  },
  loyalBadgeText: { fontFamily: 'Inter-Medium', fontSize: 10, color: colors.sand, letterSpacing: 0.8 },
  buyoutPriceBox: { alignItems: 'center', gap: 2 },
  buyoutPrice: { fontFamily: 'Inter-Bold', fontSize: 18, color: colors.cream, letterSpacing: -0.4 },
  buyoutPriceSub: { fontFamily: 'Inter-Regular', fontSize: 10, color: colors.sand + 'AA' },

  // Return requested
  returnRequestedCard: {
    marginHorizontal: 22, marginTop: 18,
    backgroundColor: colors.success + '10',
    borderRadius: 16, padding: 18, gap: 10,
    borderWidth: 1, borderColor: colors.success + '30',
  },
  returnRequestedTitle: { fontFamily: 'Inter-Bold', fontSize: 15, color: colors.navy },
  returnRequestedSub: { fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, lineHeight: 19 },
  returnRequestedLink: { fontFamily: 'Inter-Medium', fontSize: 13, color: colors.navy + 'AA' },

  // Action grid
  section: { paddingHorizontal: 22, paddingTop: 22, gap: 12 },
  sectionLabel: {
    fontFamily: 'Inter-Medium', fontSize: 11,
    color: colors.slate, letterSpacing: 1.2, textTransform: 'uppercase',
  },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    flex: 1, minWidth: '44%',
    backgroundColor: colors.white,
    borderRadius: 14, padding: 16, gap: 8,
    borderWidth: 1, borderColor: colors.sand + '80',
  },
  actionCardLabel: {
    fontFamily: 'Inter-Bold', fontSize: 14,
    color: colors.navy, letterSpacing: -0.2,
  },
  actionCardSub: {
    fontFamily: 'Inter-Regular', fontSize: 12,
    color: colors.slate, lineHeight: 16,
  },

  // Info note (early return)
  infoNote: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: colors.sand + '28',
    borderRadius: 12, padding: 12,
  },
  infoNoteText: {
    fontFamily: 'Inter-Regular', fontSize: 12,
    color: colors.slate, flex: 1, lineHeight: 17,
  },

  // In-transit
  inTransitBox: {
    flexDirection: 'row', gap: 14, alignItems: 'flex-start',
    marginHorizontal: 22, marginTop: 18,
    backgroundColor: colors.white,
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.sand + '60',
  },
  inTransitTitle: { fontFamily: 'Inter-Bold', fontSize: 14, color: colors.navy },
  inTransitSub: { fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate, lineHeight: 17 },

  // Grace period note
  graceNote: {
    marginHorizontal: 22, marginTop: 14, marginBottom: 4,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  graceNoteText: {
    fontFamily: 'Inter-Regular', fontSize: 12,
    color: colors.slate, textAlign: 'center', lineHeight: 17,
  },
})
