import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useState, useRef } from 'react'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useTabBarStore } from '@/store/tabBarStore'
import { useActiveRentals } from '@/hooks/useRentals'
import { useSavedWardrobes } from '@/hooks/useSavedWardrobes'
import { WardrobeCard } from '@/components/wardrobe/WardrobeCard'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { RentalActionSheet } from '@/components/rental/RentalActionSheet'
import type { RentalWithPiece } from '@/components/rental/RentalActionSheet'
import { formatCents, formatCentsPerMonth, formatDate, formatNextBilling, statusLabel, statusColor } from '@/utils/format'
import { multiPieceDiscount, LOYALTY_BUYOUT_BONUS_MONTHS } from '@/utils/pricing'
import { callEdgeFunction, supabase } from '@/lib/supabase'
import { colors } from '@/constants/colors'
import { layout, DEFAULT_BLURHASH } from '@/constants/layout'

export default function AccountScreen() {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const { session, profile } = useAuthStore()
  const userId = session?.user.id
  const { data: savedWardrobes } = useSavedWardrobes(userId)
  const { data: rentals, isLoading, isError: rentalsError, refetch: refetchRentals } = useActiveRentals(userId)
  const setScrolledDown = useTabBarStore(s => s.setScrolledDown)
  const lastScrollY = useRef(0)
  const [selectedRental, setSelectedRental] = useState<RentalWithPiece | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  const { data: pastOrders } = useQuery({
    queryKey: ['orders', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('id, status, created_at, total_charged')
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
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 104 }}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={e => {
        const y = e.nativeEvent.contentOffset.y
        setScrolledDown(y > lastScrollY.current && y > 60)
        lastScrollY.current = y
      }}
    >
      <View style={{ paddingHorizontal: layout.screenPadding, gap: 24 }}>

        {/* Profile header */}
        <View style={{ gap: 3 }}>
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 28, color: colors.navy, letterSpacing: -0.7 }}>
            {profile?.full_name ?? 'Account'}
          </Text>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, letterSpacing: 0.1 }}>
            {session.user.email ?? ''}
          </Text>
        </View>

        {/* Active Rentals */}
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: colors.slate, letterSpacing: 1.4, textTransform: 'uppercase' }}>
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
            <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: 24, gap: 16, borderWidth: 1, borderColor: colors.sand + '80' }}>
              <View style={{ gap: 6 }}>
                <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 19, color: colors.navy, letterSpacing: 0.1 }}>
                  Your wardrobe, waiting.
                </Text>
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, lineHeight: 21 }}>
                  Once you rent, everything lives here: your pieces, billing dates, and the option to buy anything you love at a lower price.
                </Text>
              </View>
              <View style={{ gap: 10 }}>
                {[
                  { icon: 'cube-outline' as const, text: 'Ships in 1–2 weeks' },
                  { icon: 'calendar-outline' as const, text: 'Billed every 30 days from your order date' },
                  { icon: 'pricetag-outline' as const, text: 'Buyout price drops every month you rent' },
                  { icon: 'arrow-undo-outline' as const, text: 'Request a return anytime — get your label before the next billing date' },
                ].map(item => (
                  <View key={item.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name={item.icon} size={15} color={colors.slate + 'BB'} />
                    <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, lineHeight: 18 }}>{item.text}</Text>
                  </View>
                ))}
              </View>
              <Pressable
                onPress={() => router.push('/(tabs)/pieces' as any)}
                style={{ backgroundColor: colors.navy, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
              >
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.cream, letterSpacing: 0.2 }}>Build Your Suitcase →</Text>
              </Pressable>
            </View>
          ) : (
            activeRentals.map((rental) => {
              const piece = rental.piece
              const isDelivered = rental.status === 'delivered'

              return (
                <Pressable
                  key={rental.id}
                  onPress={() => setSelectedRental(rental)}
                  accessibilityLabel={piece ? `Manage ${piece.brand ?? ''} ${piece.name}` : 'Manage rental'}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    backgroundColor: colors.white, borderRadius: 16, overflow: 'hidden',
                    borderWidth: 1, borderColor: colors.sand + '80',
                    opacity: pressed ? 0.92 : 1,
                  })}
                >
                  {/* Piece row */}
                  <View style={{ flexDirection: 'row', gap: 12, padding: 14 }}>
                    {piece?.images?.[0] ? (
                      <Image
                        source={piece.images[0]}
                        placeholder={DEFAULT_BLURHASH}
                        style={{ width: 64, height: 80, borderRadius: 10 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={{ width: 64, height: 80, borderRadius: 10, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20, color: colors.cream }}>D</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: colors.slate, textTransform: 'uppercase', letterSpacing: 0.7 }}>
                        {piece?.brand}
                      </Text>
                      <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: colors.navy, letterSpacing: -0.2 }} numberOfLines={2}>
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
                  </View>

                  {/* In-transit status strip */}
                  {['pending','sourcing','shipped'].includes(rental.status) && (
                    <View style={{ borderTopWidth: 1, borderTopColor: colors.sand + '50', paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name={rental.status === 'shipped' ? 'airplane-outline' : 'cube-outline'} size={14} color={colors.slate} />
                      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate, flex: 1, lineHeight: 17 }}>
                        {rental.status === 'pending' ? 'Order confirmed. Your piece ships in 1–2 weeks.' :
                         rental.status === 'sourcing' ? 'Your piece ships in 1–2 weeks. Tracking info comes via email.' :
                         rental.tracking_number ? `${rental.carrier ? rental.carrier + ': ' : ''}${rental.tracking_number}` :
                         "On its way. You'll get tracking info via email shortly."}
                      </Text>
                    </View>
                  )}

                  {/* Action chips */}
                  {!rental.bought_out && ['delivered', 'shipped', 'sourcing', 'pending', 'return_requested'].includes(rental.status) && (
                    <View style={{
                      borderTopWidth: 1, borderTopColor: colors.sand + '40',
                      paddingHorizontal: 14, paddingVertical: 10,
                      flexDirection: 'row', gap: 8, alignItems: 'center',
                    }}>
                      {/* Return requested chip */}
                      {rental.status === 'return_requested' ? (
                        <View style={{
                          flexDirection: 'row', alignItems: 'center', gap: 5,
                          backgroundColor: colors.success + '18', borderRadius: 20,
                          paddingHorizontal: 12, paddingVertical: 6,
                          borderWidth: 1, borderColor: colors.success + '30',
                        }}>
                          <Ionicons name="checkmark-circle-outline" size={12} color={colors.success} />
                          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: colors.navy }}>
                            Label on its way
                          </Text>
                        </View>
                      ) : (
                        <>
                          {/* Buy chip — apply loyalty discount if 6+ months, matching the action sheet */}
                          {(rental.buyout_price_snapshot ?? 0) > 0 && (() => {
                            const months = Math.floor((Date.now() - new Date(rental.created_at).getTime()) / (30 * 24 * 60 * 60 * 1000))
                            const chipPrice = months >= LOYALTY_BUYOUT_BONUS_MONTHS
                              ? Math.round((rental.buyout_price_snapshot ?? 0) * 0.95)
                              : (rental.buyout_price_snapshot ?? 0)
                            return (
                              <View style={{
                                flexDirection: 'row', alignItems: 'center', gap: 5,
                                backgroundColor: colors.navy, borderRadius: 20,
                                paddingHorizontal: 12, paddingVertical: 6,
                              }}>
                                <Ionicons name="bag-handle-outline" size={12} color={colors.cream} />
                                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: colors.cream }}>
                                  Buy · {formatCents(chipPrice)}
                                </Text>
                              </View>
                            )
                          })()}
                          {/* Return chip — shown for delivered and in-transit */}
                          {(isDelivered || ['shipped', 'sourcing', 'pending'].includes(rental.status)) && (
                            <View style={{
                              flexDirection: 'row', alignItems: 'center', gap: 5,
                              backgroundColor: colors.sand + '40', borderRadius: 20,
                              paddingHorizontal: 12, paddingVertical: 6,
                            }}>
                              <Ionicons name="arrow-undo-outline" size={12} color={colors.navy} />
                              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: colors.navy }}>
                                Return
                              </Text>
                            </View>
                          )}
                        </>
                      )}
                      <Ionicons name="chevron-forward" size={13} color={colors.gray400} style={{ marginLeft: 'auto' }} />
                    </View>
                  )}
                </Pressable>
              )
            })
          )}
        </View>

        {/* Monthly Billing summary */}
        {activeRentals.length > 0 && (
          <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: 18, gap: 10, borderWidth: 1, borderColor: colors.sand + '80' }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: colors.slate, letterSpacing: 1.4, textTransform: 'uppercase' }}>Monthly Billing</Text>

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
          <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: 18, gap: 6, borderWidth: 1, borderColor: colors.sand + '80' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy }}>Ships to</Text>
              <Pressable
                onPress={() => router.push('/update-address' as any)}
                accessibilityLabel="Edit shipping address"
                accessibilityRole="button"
                hitSlop={12}
              >
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.navy + '80' }}>Edit →</Text>
              </Pressable>
            </View>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, lineHeight: 20 }}>
              {profile.shipping_address.line1}
              {profile.shipping_address.line2 ? `\n${profile.shipping_address.line2}` : ''}
              {'\n'}{profile.shipping_address.city}, {profile.shipping_address.state} {profile.shipping_address.zip}
            </Text>
          </View>
        )}

        {/* Security deposit */}
        {profile?.deposit_status === 'held' && profile.deposit_amount > 0 && (
          <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: 18, gap: 4, borderWidth: 1, borderColor: colors.sand + '80' }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy }}>Security Deposit</Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, lineHeight: 20 }}>
              {formatCents(profile.deposit_amount)} on hold. Refunded in full when all pieces are returned.
            </Text>
          </View>
        )}

        {/* Saved Wardrobes */}
        {(savedWardrobes?.length ?? 0) > 0 && (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: colors.slate, letterSpacing: 1.4, textTransform: 'uppercase' }}>
                Saved Wardrobes
              </Text>
              <Pressable onPress={() => router.push('/(tabs)/pieces' as any)} hitSlop={12}>
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: colors.navy + 'AA' }}>Browse all →</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingVertical: 2 }}
            >
              {savedWardrobes?.map((w, i) => (
                <Animated.View key={w.id} entering={FadeInDown.delay(i * 60).springify()}>
                  <WardrobeCard wardrobe={w} />
                </Animated.View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Order History */}
        {(pastOrders?.length ?? 0) > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: colors.slate, letterSpacing: 1.4, textTransform: 'uppercase' }}>Order History</Text>
            {pastOrders?.map(order => (
              <Pressable
                key={order.id}
                onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } } as any)}
                accessibilityRole="button"
                accessibilityLabel={`View order from ${formatDate(order.created_at)}`}
                style={{
                  backgroundColor: colors.white, borderRadius: 16, padding: 16,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  borderWidth: 1, borderColor: colors.sand + '80',
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

        {/* Help & Support */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: colors.slate, letterSpacing: 1.4, textTransform: 'uppercase' }}>Help & Support</Text>
          <View style={{ backgroundColor: colors.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.sand + 'AA' }}>
            <Pressable
              onPress={() => router.push('/faq' as any)}
              accessibilityRole="button"
              accessibilityLabel="Frequently asked questions"
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.sand }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name="help-circle-outline" size={20} color={colors.slate} />
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.navy }}>Common questions</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.gray400} />
            </Pressable>
            <Pressable
              onPress={() => Linking.openURL('mailto:support@davenport.rentals')}
              accessibilityRole="button"
              accessibilityLabel="Email support"
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.sand }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name="mail-outline" size={20} color={colors.slate} />
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.navy }}>Email support</Text>
              </View>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate }}>support@davenport.rentals</Text>
            </Pressable>
            <Pressable
              onPress={() => Linking.openURL('mailto:support@davenport.rentals?subject=Inventory Request')}
              accessibilityRole="button"
              accessibilityLabel="Request a piece"
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name="shirt-outline" size={20} color={colors.slate} />
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.navy }}>Request a piece</Text>
              </View>
              <Ionicons name="open-outline" size={15} color={colors.gray400} />
            </Pressable>
          </View>
        </View>

        {/* Sign out */}
        <Pressable
          onPress={handleSignOut}
          disabled={signingOut}
          accessibilityLabel="Sign out"
          accessibilityRole="button"
          style={{
            borderWidth: 1, borderColor: colors.sand + 'CC', borderRadius: 14,
            paddingVertical: 16, alignItems: 'center',
            opacity: signingOut ? 0.5 : 1,
          }}
        >
          {signingOut ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color={colors.slate} size="small" />
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.slate }}>Signing out…</Text>
            </View>
          ) : (
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.slate, letterSpacing: 0.1 }}>Sign Out</Text>
          )}
        </Pressable>

        {/* Delete account */}
        <Pressable
          onPress={() => {
            if (activeRentals.length > 0) {
              Alert.alert(
                'Active Rentals',
                'You have active rentals that must be returned before deleting your account. Go to your rentals to request a return.',
                [{ text: 'OK' }]
              )
              return
            }
            Alert.alert(
              'Delete Account',
              'This permanently deletes your account and all personal data. This cannot be undone.',
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

    <RentalActionSheet
      visible={selectedRental !== null}
      onClose={() => setSelectedRental(null)}
      rental={selectedRental}
      userId={userId}
    />
    </View>
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
