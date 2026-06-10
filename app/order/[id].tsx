import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, router } from 'expo-router'
import { Image } from 'expo-image'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQueryClient } from '@tanstack/react-query'
import { useOrder } from '@/hooks/useOrder'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { formatCents, formatDate, statusLabel, statusColor } from '@/utils/format'
import { LOYALTY_BUYOUT_BONUS_MONTHS } from '@/utils/pricing'
import { callEdgeFunction } from '@/lib/supabase'
import { colors } from '@/constants/colors'
import { layout, DEFAULT_BLURHASH } from '@/constants/layout'
import type { Rental, Piece, ShippingAddress } from '@/types'

const STATUS_MESSAGE: Record<string, string> = {
  pending:   'Order received — sourcing your pieces now.',
  confirmed: 'Order confirmed — sourcing your pieces now.',
  sourcing:  'Sourcing from the retailer. Ships within 2–3 business days.',
  shipped:   'Your pieces are on the way! Check tracking below.',
  delivered: 'Delivered. Enjoy your pieces.',
  complete:  'Order complete.',
}

const STATUS_STEPS = ['pending', 'sourcing', 'shipped', 'delivered']

type RentalWithPiece = Rental & { piece?: Piece }

function rentalMonths(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000))
}

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const { data: order, isLoading, isError, refetch } = useOrder(id)
  const [buyoutLoading, setBuyoutLoading] = useState<string | null>(null)

  async function handleBuyout(rental: RentalWithPiece, buyoutPriceCents: number) {
    Alert.alert(
      'Buy This Piece',
      `${formatCents(buyoutPriceCents)} charged once to your card on file. Monthly billing stops immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Buy for ${formatCents(buyoutPriceCents)}`,
          onPress: async () => {
            setBuyoutLoading(rental.id)
            try {
              await callEdgeFunction('process-buyout', { rental_id: rental.id })
              await queryClient.invalidateQueries({ queryKey: ['order', id] })
              Alert.alert('Purchase Complete', `${rental.piece?.name ?? 'This piece'} is now yours!`)
            } catch (err: any) {
              Alert.alert('Purchase Failed', err.message ?? 'Something went wrong.')
            } finally {
              setBuyoutLoading(null)
            }
          },
        },
      ]
    )
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, paddingTop: insets.top + 12 }}>
        <View style={{ paddingHorizontal: layout.screenPadding, gap: 16 }}>
          <Skeleton height={20} width="30%" />
          <Skeleton height={32} width="60%" />
          <Skeleton height={80} borderRadius={12} />
          <Skeleton height={80} borderRadius={12} />
          <Skeleton height={80} borderRadius={12} />
        </View>
      </View>
    )
  }

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', padding: layout.screenPadding }}>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.slate, textAlign: 'center' }}>
          Couldn't load your order. Check your connection.
        </Text>
        <Pressable
          onPress={() => refetch()}
          style={{ marginTop: 16, backgroundColor: colors.navy, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24 }}
        >
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.cream }}>Retry</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={{ marginTop: 12, padding: 8 }}>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate }}>← Go Back</Text>
        </Pressable>
      </View>
    )
  }

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', padding: layout.screenPadding }}>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.slate, textAlign: 'center' }}>
          Order not found.
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16, padding: 8 }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy }}>← Go Back</Text>
        </Pressable>
      </View>
    )
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status)

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.cream }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        onPress={() => router.back()}
        accessibilityLabel="Go back"
        accessibilityRole="button"
        style={{ paddingHorizontal: layout.screenPadding, marginBottom: 16 }}
      >
        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.navy }}>← Back</Text>
      </Pressable>

      <View style={{ paddingHorizontal: layout.screenPadding, gap: 20 }}>
        {/* Header */}
        <View>
          <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 28, color: colors.navy }}>
            Your Order
          </Text>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, marginTop: 2 }}>
            Placed {formatDate(order.created_at)} · #{order.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>

        {/* Status banner */}
        <View style={{ backgroundColor: colors.navy, borderRadius: 14, padding: 16, gap: 8 }}>
          <Badge label={statusLabel(order.status)} color={statusColor(order.status)} />
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.cream, lineHeight: 20, marginTop: 2 }}>
            {STATUS_MESSAGE[order.status] ?? order.status}
          </Text>
          {order.notes ? (
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.sand }}>
              {order.notes}
            </Text>
          ) : null}
        </View>

        {/* Progress steps */}
        {currentStepIndex >= 0 && (
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {STATUS_STEPS.map((step, i) => (
                <View
                  key={step}
                  style={{
                    flex: 1, height: 4, borderRadius: 2,
                    backgroundColor: i <= currentStepIndex ? colors.success : colors.gray200,
                  }}
                />
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {STATUS_STEPS.map((step, i) => (
                <Text key={step} style={{
                  fontFamily: i === currentStepIndex ? 'Inter-Medium' : 'Inter-Regular',
                  fontSize: 10,
                  color: i <= currentStepIndex ? colors.navy : colors.gray400,
                  textTransform: 'capitalize',
                }}>
                  {statusLabel(step)}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Rental items */}
        {(order.rentals as RentalWithPiece[])?.map((rental) => {
          const piece = rental.piece
          const months = rentalMonths(rental.created_at)
          const isLoyalty = months >= LOYALTY_BUYOUT_BONUS_MONTHS
          const buyoutPrice = isLoyalty
            ? Math.round(rental.buyout_price_snapshot * 0.95)
            : rental.buyout_price_snapshot
          const canBuyout = rental.status === 'delivered' && !rental.bought_out && buyoutPrice > 0

          return (
            <View key={rental.id} style={{ backgroundColor: colors.white, borderRadius: 14, overflow: 'hidden' }}>
              <Pressable
                onPress={() => piece && router.push({ pathname: '/piece/[id]', params: { id: piece.id } } as any)}
                style={{ padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' }}
              >
                {piece?.images?.[0] ? (
                  <Image
                    source={piece.images[0]}
                    placeholder={DEFAULT_BLURHASH}
                    style={{ width: 64, height: 80, borderRadius: 10 }}
                    contentFit="cover"
                  />
                ) : (
                  <View style={{ width: 64, height: 80, borderRadius: 10, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 20, color: colors.cream }}>D</Text>
                  </View>
                )}
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: colors.slate, textTransform: 'uppercase', letterSpacing: 0.7 }}>
                    {piece?.brand}
                  </Text>
                  <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 15, color: colors.navy }} numberOfLines={2}>
                    {piece?.name}
                  </Text>
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate }}>
                    Size {rental.size} · {formatCents(rental.rental_fee_cents)}/mo
                  </Text>
                  {rental.tracking_number && (
                    <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate, marginTop: 2 }}>
                      {rental.carrier ? `${rental.carrier}: ` : ''}{rental.tracking_number}
                    </Text>
                  )}
                  {rental.bought_out && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: colors.success }}>
                        Purchased — yours to keep
                      </Text>
                    </View>
                  )}
                </View>
                <Badge label={statusLabel(rental.status)} color={statusColor(rental.status)} />
              </Pressable>

              {/* Buyout CTA */}
              {canBuyout && (
                <View style={{ borderTopWidth: 1, borderTopColor: colors.gray100, paddingHorizontal: 14, paddingVertical: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.navy }}>
                        Own it — {formatCents(buyoutPrice)}
                      </Text>
                      {isLoyalty ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="star" size={11} color={colors.success} />
                          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.success }}>
                            Loyalty discount applied (5% off — {months}+ months)
                          </Text>
                        </View>
                      ) : months >= 3 ? (
                        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.slate }}>
                          Still loving it? Stop renting and own it.
                        </Text>
                      ) : (
                        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.slate }}>
                          Price drops with each rental month.
                        </Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => handleBuyout(rental, buyoutPrice)}
                      disabled={buyoutLoading === rental.id}
                      style={{
                        backgroundColor: colors.navy, borderRadius: 8,
                        paddingVertical: 8, paddingHorizontal: 14,
                        opacity: buyoutLoading === rental.id ? 0.6 : 1,
                        minWidth: 72, alignItems: 'center',
                      }}
                    >
                      {buyoutLoading === rental.id
                        ? <ActivityIndicator color={colors.cream} size="small" />
                        : <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.cream }}>Buy</Text>
                      }
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )
        })}

        {/* Order summary */}
        <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 16, gap: 10 }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy }}>Payment</Text>
          <SummaryRow label="First month" value={formatCents(order.first_month_total)} />
          <SummaryRow label="Handling & shipping" value={formatCents(order.handling_fee_cents)} />
          {order.deposit_amount > 0 && (
            <SummaryRow label="Security deposit (held)" value={formatCents(order.deposit_amount)} sub="Refundable when all pieces return" />
          )}
          <View style={{ height: 1, backgroundColor: colors.sand }} />
          <SummaryRow label="Charged today" value={formatCents(order.total_charged)} bold />
        </View>

        {/* Shipping address */}
        {order.shipping_address && (() => {
          const addr = order.shipping_address as ShippingAddress
          return (
            <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 16, gap: 4 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy, marginBottom: 4 }}>Ships to</Text>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate }}>
                {addr.line1}
                {addr.line2 ? `\n${addr.line2}` : ''}
                {'\n'}{addr.city}, {addr.state} {addr.zip}
              </Text>
            </View>
          )
        })()}

        {/* Returns */}
        <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 16, gap: 8 }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy }}>How to Return</Text>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, lineHeight: 20 }}>
            Email <Text style={{ fontFamily: 'Inter-Medium', color: colors.navy }}>returns@davenport.rentals</Text> with
            your order number and we'll send a prepaid USPS label within 24 hours.{'\n\n'}
            Items should be returned in received condition. Normal wear is expected and fine.
          </Text>
        </View>

        <Pressable
          onPress={() => router.replace('/(tabs)/account' as any)}
          style={{ alignItems: 'center', padding: 8 }}
        >
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate }}>
            View all rentals in{' '}
            <Text style={{ color: colors.navy, fontFamily: 'Inter-Medium' }}>Account →</Text>
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

function SummaryRow({ label, value, sub, bold }: { label: string; value: string; sub?: string; bold?: boolean }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: bold ? 'Inter-Medium' : 'Inter-Regular', fontSize: 14, color: colors.navy }}>
          {label}
        </Text>
        <Text style={{ fontFamily: bold ? 'Inter-Medium' : 'Inter-Regular', fontSize: 14, color: colors.navy }}>
          {value}
        </Text>
      </View>
      {sub && (
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.slate, marginTop: 2 }}>
          {sub}
        </Text>
      )}
    </View>
  )
}
