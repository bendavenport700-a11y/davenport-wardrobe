import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useActiveRentals } from '@/hooks/useRentals'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCents, formatCentsPerMonth, formatDate, formatNextBilling, statusLabel, statusColor } from '@/utils/format'
import { multiPieceDiscount, LOYALTY_BUYOUT_BONUS_MONTHS } from '@/utils/pricing'
import { callEdgeFunction, supabase } from '@/lib/supabase'
import { colors } from '@/constants/colors'
import { layout, DEFAULT_BLURHASH } from '@/constants/layout'
import type { Rental, Piece } from '@/types'

type RentalWithPiece = Rental & { piece?: Piece }

function rentalMonths(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000))
}

export default function AccountScreen() {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const { session, profile } = useAuthStore()
  const userId = session?.user.id
  const { data: rentals, isLoading, isError: rentalsError, refetch: refetchRentals } = useActiveRentals(userId)
  const [buyoutLoading, setBuyoutLoading] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  const { data: pastOrders } = useQuery({
    queryKey: ['orders', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('id, status, created_at, total_charged, first_month_total')
        .eq('user_id', userId!).order('created_at', { ascending: false }).limit(10)
      return data ?? []
    },
    staleTime: 60_000,
  })

  const activeRentals = (rentals ?? []) as RentalWithPiece[]

  const nextBillingDate = activeRentals
    .map(r => r.next_billing_date)
    .filter((d): d is string => d !== null)
    .sort()[0] ?? null

  const rawMonthly = activeRentals.reduce((sum, r) => sum + r.rental_fee_cents, 0)
  const discountRate = multiPieceDiscount(activeRentals.length)
  const savingsCents = Math.round(rawMonthly * discountRate)
  const discountedMonthly = rawMonthly - savingsCents

  async function handleBuyout(rental: RentalWithPiece, buyoutPriceCents: number) {
    const pieceName = [rental.piece?.brand, rental.piece?.name].filter(Boolean).join(' ')
    Alert.alert(
      'Buy This Piece',
      `${pieceName || 'This piece'} — ${formatCents(buyoutPriceCents)} charged once to your card on file. Monthly billing stops immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Buy for ${formatCents(buyoutPriceCents)}`,
          onPress: async () => {
            setBuyoutLoading(rental.id)
            try {
              await callEdgeFunction('process-buyout', { rental_id: rental.id })
              await queryClient.invalidateQueries({ queryKey: ['rentals', 'active', userId] })
              Alert.alert('Purchase Complete', `${rental.piece?.name ?? 'This piece'} is now yours — billing stopped.`)
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

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Sign out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true)
          try {
            await supabase.auth.signOut()
          } catch {
            setSigningOut(false)
            Alert.alert('Sign Out Failed', 'Could not sign out. Check your connection and try again.')
          }
        },
      },
    ])
  }

  if (!userId) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', padding: layout.screenPadding }}>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.slate, textAlign: 'center' }}>
          Sign in to view your account.
        </Text>
        <Pressable onPress={() => router.replace('/(auth)/login' as any)} style={{ marginTop: 16, padding: 8 }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.navy }}>Sign In →</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.cream }}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: layout.screenPadding, gap: 24 }}>

        {/* Profile header */}
        <View style={{ gap: 2 }}>
          <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 30, color: colors.navy }}>
            {profile?.full_name ?? 'Account'}
          </Text>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate }}>
            {session.user.email}
          </Text>
        </View>

        {/* Active Rentals */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 16, color: colors.navy }}>
            Active Rentals{activeRentals.length > 0 ? ` (${activeRentals.length})` : ''}
          </Text>

          {isLoading ? (
            <>
              <Skeleton height={100} borderRadius={14} />
              <Skeleton height={100} borderRadius={14} />
            </>
          ) : rentalsError ? (
            <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 24, alignItems: 'center', gap: 12 }}>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.slate, textAlign: 'center' }}>
                Couldn't load rentals. Check your connection.
              </Text>
              <Pressable
                onPress={() => refetchRentals()}
                style={{ backgroundColor: colors.navy, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 }}
              >
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.cream }}>Retry</Text>
              </Pressable>
            </View>
          ) : activeRentals.length === 0 ? (
            <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 24, alignItems: 'center', gap: 12 }}>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.slate, textAlign: 'center' }}>
                No active rentals yet.
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/pieces' as any)}
                style={{ backgroundColor: colors.navy, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 }}
              >
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.cream }}>Browse Pieces</Text>
              </Pressable>
            </View>
          ) : (
            activeRentals.map((rental) => {
              const piece = rental.piece
              const months = rentalMonths(rental.created_at)
              const isLoyalty = months >= LOYALTY_BUYOUT_BONUS_MONTHS
              const buyoutPrice = isLoyalty
                ? Math.round(rental.buyout_price_snapshot * 0.95)
                : rental.buyout_price_snapshot
              const canBuyout = rental.status === 'delivered' && !rental.bought_out && buyoutPrice > 0

              return (
                <View key={rental.id} style={{ backgroundColor: colors.white, borderRadius: 14, overflow: 'hidden' }}>
                  {/* Piece row */}
                  <Pressable
                    onPress={() => piece && router.push({ pathname: '/piece/[id]', params: { id: piece.id } } as any)}
                    accessibilityLabel={piece ? `View ${piece.brand ?? ''} ${piece.name}` : 'View piece'}
                    accessibilityRole="button"
                    style={{ flexDirection: 'row', gap: 12, padding: 14 }}
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
                        Size {rental.size} · {formatCentsPerMonth(rental.rental_fee_cents)}
                      </Text>
                      {rental.next_billing_date && (
                        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.gray400, marginTop: 1 }}>
                          {formatNextBilling(rental.next_billing_date)}
                        </Text>
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
                            Buy outright — {formatCents(buyoutPrice)}
                          </Text>
                          {isLoyalty ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Ionicons name="star" size={11} color={colors.success} />
                              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.success }}>
                                Loyalty discount (5% off · {months}+ months)
                              </Text>
                            </View>
                          ) : months >= 3 ? (
                            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.slate }}>
                              Still loving it? Own it instead.
                            </Text>
                          ) : (
                            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.slate }}>
                              Price drops each rental month.
                            </Text>
                          )}
                        </View>
                        <Pressable
                          onPress={() => handleBuyout(rental, buyoutPrice)}
                          disabled={buyoutLoading === rental.id}
                          accessibilityLabel={`Buy ${rental.piece?.name ?? 'this piece'} for ${formatCents(buyoutPrice)}`}
                          accessibilityRole="button"
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
            })
          )}
        </View>

        {/* Monthly Billing summary */}
        {activeRentals.length > 0 && (
          <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 16, gap: 10 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy }}>Monthly Billing</Text>

            <BillingRow
              label={`${activeRentals.length} ${activeRentals.length === 1 ? 'rental' : 'rentals'}`}
              value={formatCentsPerMonth(rawMonthly)}
            />

            {savingsCents > 0 && (
              <BillingRow
                label={`Bundle discount (${Math.round(discountRate * 100)}% off)`}
                value={`−${formatCents(savingsCents)}/mo`}
                valueColor={colors.success}
              />
            )}

            {savingsCents > 0 && (
              <>
                <View style={{ height: 1, backgroundColor: colors.sand }} />
                <BillingRow label="Monthly total" value={formatCentsPerMonth(discountedMonthly)} bold />
              </>
            )}

            {nextBillingDate && (
              <>
                <View style={{ height: 1, backgroundColor: colors.sand }} />
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate }}>
                  Next charge: {formatDate(nextBillingDate)}
                </Text>
              </>
            )}
          </View>
        )}

        {/* Shipping address */}
        {profile?.shipping_address && (
          <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 16, gap: 6 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy }}>Ships to</Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, lineHeight: 20 }}>
              {profile.shipping_address.line1}
              {profile.shipping_address.line2 ? `\n${profile.shipping_address.line2}` : ''}
              {'\n'}{profile.shipping_address.city}, {profile.shipping_address.state} {profile.shipping_address.zip}
            </Text>
          </View>
        )}

        {/* Security deposit */}
        {profile?.deposit_status === 'held' && profile.deposit_amount > 0 && (
          <View style={{ backgroundColor: colors.white, borderRadius: 14, padding: 16, gap: 4 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy }}>Security Deposit</Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, lineHeight: 20 }}>
              {formatCents(profile.deposit_amount)} on hold. Refunded in full when all pieces are returned.
            </Text>
          </View>
        )}

        {/* Order History */}
        {(pastOrders?.length ?? 0) > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 16, color: colors.navy }}>Order History</Text>
            {pastOrders!.map(order => (
              <Pressable
                key={order.id}
                onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } } as any)}
                accessibilityRole="button"
                accessibilityLabel={`View order from ${formatDate(order.created_at)}`}
                style={{
                  backgroundColor: colors.white, borderRadius: 14, padding: 16,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <View style={{ gap: 2 }}>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy }}>
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </Text>
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate }}>
                    {formatDate(order.created_at)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Badge label={statusLabel(order.status)} color={statusColor(order.status)} />
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate }}>
                    {formatCents(order.total_charged)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Sign out */}
        <Pressable
          onPress={handleSignOut}
          disabled={signingOut}
          accessibilityLabel="Sign out"
          accessibilityRole="button"
          style={{
            borderWidth: 1, borderColor: colors.gray200, borderRadius: 14,
            paddingVertical: 16, alignItems: 'center',
            opacity: signingOut ? 0.5 : 1,
          }}
        >
          {signingOut
            ? <ActivityIndicator color={colors.slate} size="small" />
            : <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.slate }}>Sign Out</Text>
          }
        </Pressable>

        {/* Delete account */}
        <Pressable
          onPress={() => {
            Alert.alert(
              'Delete Account',
              'This permanently deletes your account and all personal data. Active rentals must be returned first. This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete My Account',
                  style: 'destructive',
                  onPress: async () => {
                    setDeletingAccount(true)
                    try {
                      await callEdgeFunction('delete-account', {})
                      await supabase.auth.signOut()
                    } catch (err: any) {
                      setDeletingAccount(false)
                      Alert.alert('Could Not Delete Account', err.message ?? 'Please email support@davenport.rentals for help.')
                    }
                  },
                },
              ]
            )
          }}
          disabled={deletingAccount}
          accessibilityLabel="Delete account"
          accessibilityRole="button"
          style={{ alignItems: 'center', paddingVertical: 8, opacity: deletingAccount ? 0.5 : 1 }}
        >
          {deletingAccount
            ? <ActivityIndicator color={colors.error} size="small" />
            : <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.error }}>Delete Account</Text>
          }
        </Pressable>

      </View>
    </ScrollView>
  )
}

function BillingRow({ label, value, valueColor, bold }: { label: string; value: string; valueColor?: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ fontFamily: bold ? 'Inter-Medium' : 'Inter-Regular', fontSize: 14, color: colors.navy, flex: 1 }}>
        {label}
      </Text>
      <Text style={{ fontFamily: bold ? 'Inter-Medium' : 'Inter-Regular', fontSize: 14, color: valueColor ?? colors.navy }}>
        {value}
      </Text>
    </View>
  )
}
