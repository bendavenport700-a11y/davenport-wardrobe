import { ScrollView, View, Text, Pressable, Linking } from 'react-native'
import { router } from 'expo-router'
import { useState, useEffect, useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTabBarStore } from '@/store/tabBarStore'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useQueryClient } from '@tanstack/react-query'
import { useWardrobes } from '@/hooks/useWardrobes'
import { useFeaturedPieces } from '@/hooks/useFeaturedPieces'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { useTripsEnabled } from '@/hooks/useAppSettings'
import { useAuthStore } from '@/store/authStore'
import { useSuitcaseStore, useSuitcaseHydrated } from '@/store/suitcaseStore'
import { WardrobeCard } from '@/components/wardrobe/WardrobeCard'
import { WardrobeCardSkeleton, PieceCardSkeleton } from '@/components/ui/Skeleton'
import { PieceCard } from '@/components/piece/PieceCard'
import { HowItWorksStrip } from '@/components/home/HowItWorksStrip'
import { colors } from '@/constants/colors'
import { layout } from '@/constants/layout'

const WELCOME_KEY = 'davenport:welcome_seen'

const BRANDS = [
  'Vuori', 'Bonobos', 'Faherty', 'Rhone', 'Todd Snyder', 'Buck Mason',
  'Theory', 'J.Crew', 'Club Monaco', 'Mack Weldon', 'Reigning Champ',
  'Peter Millar', 'AllSaints', 'Alo', 'Patagonia', 'Arc\'teryx',
  'Lululemon', 'Tracksmith', 'Rails', 'Billy Reid',
]
const BRANDS_DOUBLED = [...BRANDS, ...BRANDS]

type WhyRentItem = { icon: React.ComponentProps<typeof Ionicons>['name']; heading: string; body: string }

const WHY_RENT_FEATURED: WhyRentItem[] = [
  { icon: 'hand-left-outline',       heading: 'Try it first',          body: "Wear a piece for a month. Buy at a lower price if you love it. Return it if you don't." },
  { icon: 'star-outline',            heading: 'Wear better brands',    body: 'A $150 piece for $18/mo. Quality that used to require a big purchase upfront.' },
  { icon: 'swap-horizontal-outline', heading: 'Style that adapts',     body: "Trends shift. Life shifts. Never get stuck with a closet that doesn't fit anymore." },
  { icon: 'pricetag-outline',        heading: 'Buyout price drops',    body: 'Keep renting and the path to ownership gets cheaper every month, automatically.' },
  { icon: 'archive-outline',         heading: 'No closet clutter',     body: "Return what you don't reach for. Only keep what earns its place." },
  { icon: 'leaf-outline',            heading: 'Sustainable by design', body: 'More wears per piece. Less demand for new production. The more conscious choice.' },
]

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { session, profile } = useAuthStore()
  const userId = session?.user.id
  const itemCount = useSuitcaseStore(s => s.items.length)
  const suitcaseHydrated = useSuitcaseHydrated()
  const queryClient = useQueryClient()
  const { data: wardrobes, isLoading: wardrobesLoading, isError: wardrobesError } = useWardrobes()
  const { data: featured, isLoading: featuredLoading, isError: featuredError } = useFeaturedPieces()
  const { data: announcements } = useAnnouncements()
  const tripsEnabled = useTripsEnabled()

  const [welcomeDismissed, setWelcomeDismissed] = useState<boolean | null>(null)
  const [dismissedUpdates, setDismissedUpdates] = useState<Set<string>>(new Set())

  const wardrobeScrollRef = useRef<ScrollView>(null)
  const setScrolledDown = useTabBarStore(s => s.setScrolledDown)
  const lastScrollY = useRef(0)

  // Continuous brand ticker
  const brandTranslateX = useSharedValue(0)
  const BRAND_TICKER_WIDTH = BRANDS.length * 122 // ~avg pill width + gap
  const brandAnimStyle = useAnimatedStyle(() => ({ transform: [{ translateX: brandTranslateX.value }] }))
  useEffect(() => {
    brandTranslateX.value = withRepeat(
      withTiming(-BRAND_TICKER_WIDTH, { duration: BRANDS.length * 1800, easing: Easing.linear }),
      -1,
      false,
    )
  }, [])
  const [wardrobeIdx, setWardrobeIdx] = useState(0)
  const wardrobeUserScrolling = useRef(false)
  const WARDROBE_ITEM_W = 232

  useEffect(() => {
    const count = wardrobes?.length ?? 0
    if (count <= 1) return
    const t = setInterval(() => {
      if (wardrobeUserScrolling.current) return
      setWardrobeIdx(prev => {
        const next = (prev + 1) % count
        wardrobeScrollRef.current?.scrollTo({ x: next * WARDROBE_ITEM_W, animated: true })
        return next
      })
    }, 3000)
    return () => clearInterval(t)
  }, [wardrobes?.length])

  useEffect(() => {
    if (!session || (profile?.active_rental_count ?? 0) > 0) return
    const signedUpAt = new Date(profile?.created_at ?? 0)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    if (signedUpAt < sevenDaysAgo) return
    AsyncStorage.getItem(WELCOME_KEY).then(val => {
      setWelcomeDismissed(val ? true : false)
    })
  }, [session, profile])

  const dismissWelcome = () => {
    setWelcomeDismissed(true)
    AsyncStorage.setItem(WELCOME_KEY, 'true')
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.navy }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={e => {
        const y = e.nativeEvent.contentOffset.y
        setScrolledDown(y > lastScrollY.current && y > 60)
        lastScrollY.current = y
      }}
    >
      {/* Hero */}
      <View style={{ backgroundColor: colors.navy, paddingTop: 28, paddingBottom: 26, alignItems: 'center' }}>
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 40, color: colors.cream, letterSpacing: 6, textAlign: 'center' }}>
          DAVENPORT
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, paddingHorizontal: layout.screenPadding }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.sand + '35' }} />
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.sand, letterSpacing: 0.4, textAlign: 'center' }}>
            Try it. Rent it. Own it if you want to.
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.sand + '35' }} />
        </View>
      </View>

      {/* Brand ticker — continuous auto-scroll, no user interaction */}
      <View style={{
        borderBottomWidth: 1, borderBottomColor: colors.sand + '55',
        paddingVertical: 16, overflow: 'hidden',
      }}>
        <Text style={{
          fontFamily: 'Inter-Medium', fontSize: 9, color: colors.slate + '80',
          textAlign: 'center', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12,
        }}>
          Brands we carry
        </Text>
        <Animated.View style={[brandAnimStyle, { flexDirection: 'row', gap: 8, alignItems: 'center' }]}>
          {BRANDS_DOUBLED.map((brand, i) => (
            <View key={i} style={{
              borderWidth: 1, borderColor: colors.sand + 'CC',
              borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
              backgroundColor: colors.white,
            }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: colors.navy, letterSpacing: 0.1 }}>
                {brand}
              </Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Dismissible announcements — live from admin, session-only dismiss */}
      {(() => {
        const activeAnnouncements = (announcements ?? []).filter(a => !dismissedUpdates.has(a.id))
        if (!activeAnnouncements.length) return null
        return (
        <View style={{ paddingHorizontal: layout.screenPadding, paddingTop: 16, paddingBottom: 4, gap: 10 }}>
          {activeAnnouncements
            .map((a, i) => (
              <Animated.View
                key={a.id}
                entering={FadeInDown.delay(i * 60).springify()}
                style={{ borderRadius: 16, backgroundColor: colors.cream, overflow: 'hidden', flexDirection: 'row' }}
              >
                {/* Amber left stripe — stands out on the navy background */}
                <View style={{ width: 4, backgroundColor: colors.accent }} />
                {/* Content */}
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 }}>
                  {/* Icon */}
                  <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: colors.accent + '15', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <Ionicons name={a.icon as React.ComponentProps<typeof Ionicons>['name']} size={19} color={colors.accent} />
                  </View>
                  {/* Text */}
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: colors.accent, textTransform: 'uppercase', letterSpacing: 1.8 }}>
                      Announcement
                    </Text>
                    <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.navy, lineHeight: 22 }}>
                      {a.message}
                    </Text>
                  </View>
                  {/* Dismiss */}
                  <Pressable
                    onPress={() => setDismissedUpdates(prev => new Set([...prev, a.id]))}
                    hitSlop={14}
                    accessibilityLabel="Dismiss announcement"
                    style={{ marginTop: 2 }}
                  >
                    <Ionicons name="close" size={15} color={colors.slate + '80'} />
                  </Pressable>
                </View>
              </Animated.View>
            ))
          }
        </View>
        )
      })()}

      {/* Welcome banner — new signed-in users, 0 rentals, within first 7 days */}
      {session && welcomeDismissed === false && (
        <Animated.View entering={FadeInDown.springify()} style={{
          margin: layout.screenPadding,
          marginBottom: 0,
          backgroundColor: colors.ink,
          borderRadius: 14,
          padding: 18,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          borderWidth: 1,
          borderColor: colors.sand + '25',
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: colors.cream, letterSpacing: -0.4, marginBottom: 4 }}>
              {profile?.full_name ? `Welcome, ${profile.full_name.split(' ')[0]}.` : 'Welcome to Davenport.'}
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.sand, lineHeight: 20 }}>
              Add pieces to your suitcase, rent monthly, and buy anything you love at a lower price. No risk, no commitment.
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/pieces')}
              style={{ marginTop: 12, alignSelf: 'flex-start', backgroundColor: colors.cream, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy }}>
                Start browsing →
              </Text>
            </Pressable>
          </View>
          <Pressable onPress={dismissWelcome} style={{ padding: 4 }} accessibilityLabel="Dismiss welcome banner">
            <Ionicons name="close" size={18} color={colors.sand} />
          </Pressable>
        </Animated.View>
      )}

      {/* Wardrobes — moved up so clothing is front and center */}
      <View style={{ paddingTop: 28, paddingBottom: 20 }}>
        <View style={{ paddingHorizontal: layout.screenPadding, marginBottom: 16, gap: 4 }}>
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 22, color: colors.cream, letterSpacing: -0.5 }}>
            The Wardrobes
          </Text>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.sand, lineHeight: 21 }}>
            Curated collections built around how you actually live.
          </Text>
        </View>
        <ScrollView
          ref={wardrobeScrollRef}
          horizontal showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => { wardrobeUserScrolling.current = true }}
          onScrollEndDrag={() => { setTimeout(() => { wardrobeUserScrolling.current = false }, 2000) }}
          onMomentumScrollEnd={e => setWardrobeIdx(Math.round(e.nativeEvent.contentOffset.x / WARDROBE_ITEM_W))}
          contentContainerStyle={{ paddingHorizontal: layout.screenPadding, gap: 12 }}>
          {wardrobesError ? (
            <Pressable onPress={() => queryClient.invalidateQueries({ queryKey: ['wardrobes'] })}
              style={{ paddingVertical: 12 }}>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate }}>
                Couldn't load wardrobes. Tap to retry.
              </Text>
            </Pressable>
          ) : wardrobesLoading
            ? [0, 1].map(i => <WardrobeCardSkeleton key={i} />)
            : wardrobes && wardrobes.length === 0
            ? (
              <View style={{ paddingVertical: 12 }}>
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate }}>
                  New wardrobes coming soon.
                </Text>
              </View>
            )
            : wardrobes?.map((w, i) => (
                <Animated.View key={w.id} entering={FadeInDown.delay(i * 50).springify()}>
                  <WardrobeCard wardrobe={w} />
                </Animated.View>
              ))
          }
        </ScrollView>
        {(wardrobes?.length ?? 0) > 1 && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 10 }}>
            {wardrobes?.map((_, i) => (
              <View key={i} style={{
                height: 5, borderRadius: 2.5,
                width: i === wardrobeIdx ? 16 : 5,
                backgroundColor: i === wardrobeIdx ? colors.cream : colors.sand + '60',
              }} />
            ))}
          </View>
        )}

      </View>

      {/* Create a Plan */}
      {tripsEnabled && (
        <View style={{ marginHorizontal: layout.screenPadding, marginBottom: 20 }}>
          <Pressable
            onPress={() => router.push('/trip/new' as any)}
            accessibilityRole="button"
            accessibilityLabel="Create a plan"
            style={({ pressed }) => ({
              backgroundColor: colors.ink,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.sand + '20',
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: colors.sand + '15', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="calendar-outline" size={22} color={colors.sand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: colors.cream, letterSpacing: -0.3 }}>
                  Create a Plan
                </Text>
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.sand, marginTop: 2 }}>
                  Curate pieces for a trip, event, or season
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.sand + '80'} />
            </View>
          </Pressable>
        </View>
      )}

      {/* Featured Pieces */}
      <View style={{ paddingHorizontal: layout.screenPadding, paddingBottom: 28 }}>
        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 22, color: colors.cream, marginBottom: 16, letterSpacing: -0.5 }}>
          Featured Pieces
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: layout.cardGap }}>
          {featuredError ? (
            <Pressable onPress={() => queryClient.invalidateQueries({ queryKey: ['pieces', 'featured'] })}
              style={{ width: '100%', paddingVertical: 12 }}>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate }}>
                Couldn't load pieces. Tap to retry.
              </Text>
            </Pressable>
          ) : featuredLoading
            ? [0, 1, 2, 3].map(i => (
                <View key={i} style={{ width: '50%' }}>
                  <PieceCardSkeleton />
                </View>
              ))
            : featured?.slice(0, 6).map((piece, i) => (
                <View key={piece.id} style={{ width: '50%' }}>
                  <PieceCard piece={piece} index={i} />
                </View>
              ))
          }
        </View>
      </View>

      {/* How It Works — after clothing so users see the product first */}
      <HowItWorksStrip />

      {/* Why Rent */}
      <View style={{ backgroundColor: colors.ink, paddingVertical: 36, paddingHorizontal: layout.screenPadding }}>
        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: colors.sand, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>
          Why rent
        </Text>
        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 24, color: colors.cream, letterSpacing: -0.6, lineHeight: 30, marginBottom: 24 }}>
          Clothes built for how{'\n'}life actually works.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {WHY_RENT_FEATURED.map((item, i) => (
            <View key={i} style={{
              width: '47.5%',
              backgroundColor: colors.navy,
              borderRadius: 14, padding: 16, gap: 10,
              borderWidth: 1, borderColor: colors.sand + '18',
            }}>
              <View style={{
                width: 34, height: 34, borderRadius: 9,
                backgroundColor: colors.sand + '18',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name={item.icon} size={16} color={colors.sand} />
              </View>
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 13, color: colors.cream, letterSpacing: -0.2, lineHeight: 18 }}>
                {item.heading}
              </Text>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.sand + 'CC', lineHeight: 16 }}>
                {item.body}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Sustainability */}
      <View style={{ marginHorizontal: layout.screenPadding, marginTop: 16, marginBottom: 16 }}>
        <View style={{ backgroundColor: colors.sustainBg, borderRadius: 18, padding: 22, gap: 16 }}>
          {/* Eyebrow */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: colors.sustainGreen + '25', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="leaf" size={12} color={colors.sustainGreen} />
            </View>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: colors.sustainGreen, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Conscious Fashion
            </Text>
          </View>

          {/* Headline */}
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 22, color: colors.cream, letterSpacing: -0.5, lineHeight: 28 }}>
            Renting is better{'\n'}for the planet.
          </Text>

          {/* Stat callout */}
          <View style={{ backgroundColor: colors.sustainCta, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.sustainGreen + '25' }}>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 13, color: colors.sustainGreen, letterSpacing: -0.1 }}>
              Every extra wear counts.
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.cream + 'BB', lineHeight: 18, marginTop: 4 }}>
              The fashion industry produces 92 million tons of waste annually. More wears per piece means less demand for new production.
            </Text>
          </View>

          {/* Points */}
          {([
            { icon: 'repeat-outline',       text: 'More wears per piece. Far less waste per garment.' },
            { icon: 'water-outline',         text: 'Less new production means less water, energy, and emissions.' },
            { icon: 'trending-down-outline', text: 'Buying less fast fashion reduces your textile footprint significantly.' },
          ] as { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }[]).map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <View style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: colors.sustainGreen + '20', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                <Ionicons name={item.icon} size={13} color={colors.sustainGreen} />
              </View>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.cream + 'AA', lineHeight: 20, flex: 1 }}>
                {item.text}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Founder note */}
      <View style={{ marginHorizontal: layout.screenPadding, marginBottom: 16 }}>
        <View style={{ backgroundColor: colors.navy, borderRadius: 18, padding: 22, gap: 14 }}>
          {/* Eyebrow */}
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: colors.sand + '80', textTransform: 'uppercase', letterSpacing: 1.5 }}>
            From the founder
          </Text>

          {/* Headline */}
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20, color: colors.cream, letterSpacing: -0.4, lineHeight: 26 }}>
            A small business,{'\n'}built from scratch.
          </Text>

          {/* Body */}
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.sand, lineHeight: 21 }}>
            I built Davenport because I was spending $200 on clothes I wore twice, then letting them sit. There had to be a better way to dress well.
          </Text>

          <View style={{ height: 1, backgroundColor: colors.sand + '20' }} />

          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.sand, lineHeight: 21 }}>
            We're still small — every customer matters and I read every message. If something isn't right, email me directly.
          </Text>

          {/* Signature row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.cream + '60', letterSpacing: 0.1 }}>
              — Ben Davenport
            </Text>
            <Pressable
              onPress={() => Linking.openURL('mailto:ben@davenport.rentals')}
              accessibilityRole="button"
              accessibilityLabel="Email the founder"
              style={{
                backgroundColor: colors.cream + '12', borderRadius: 8,
                paddingVertical: 8, paddingHorizontal: 12,
                flexDirection: 'row', alignItems: 'center', gap: 6,
                borderWidth: 1, borderColor: colors.cream + '18',
              }}>
              <Ionicons name="mail-outline" size={13} color={colors.sand} />
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: colors.sand }}>Email me</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Get in touch */}
      <View style={{ marginHorizontal: layout.screenPadding, marginBottom: 28 }}>
        <View style={{
          backgroundColor: colors.white, borderRadius: 16,
          padding: 20, borderWidth: 1, borderColor: colors.sand, gap: 14,
        }}>
          <View style={{ gap: 4 }}>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: colors.navy, letterSpacing: -0.3 }}>
              Get in touch
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, lineHeight: 20 }}>
              We read every message. Questions, requests, feedback. All of it.
            </Text>
          </View>
          <Pressable
            onPress={() => Linking.openURL('mailto:support@davenport.rentals?subject=Inventory Request')}
            accessibilityRole="button"
            accessibilityLabel="Request a piece"
            style={{
              backgroundColor: colors.navy, borderRadius: 10,
              paddingVertical: 12, alignItems: 'center', flexDirection: 'row',
              justifyContent: 'center', gap: 8,
            }}>
            <Ionicons name="shirt-outline" size={16} color={colors.cream} />
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.cream }}>
              Request a piece
            </Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL('mailto:support@davenport.rentals?subject=Question')}
            accessibilityRole="button"
            accessibilityLabel="Ask a question"
            style={{
              borderWidth: 1.5, borderColor: colors.sand, borderRadius: 10,
              paddingVertical: 12, alignItems: 'center', flexDirection: 'row',
              justifyContent: 'center', gap: 8,
            }}>
            <Ionicons name="chatbubble-outline" size={16} color={colors.navy} />
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy }}>
              Ask a question
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Guest CTA */}
      {!session && (
        <View style={{ padding: layout.screenPadding, gap: 12 }}>
          <View style={{ gap: 6, marginBottom: 12 }}>
            <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 22, color: colors.cream, textAlign: 'center' }}>
              Your wardrobe, on your terms.
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.sand, textAlign: 'center', lineHeight: 21 }}>
              Try pieces for a month. Buy what you love at a lower price. Return the rest. No questions asked.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(auth)/signup')}
            accessibilityLabel="Create a free account"
            accessibilityRole="button"
            style={{ backgroundColor: colors.accent, borderRadius: 12, padding: 18, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 16, color: colors.cream }}>
              Create a Free Account →
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            accessibilityRole="button"
            style={{ alignItems: 'center', padding: 8 }}>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.sand }}>
              Already a member?{' '}
              <Text style={{ color: colors.cream, fontFamily: 'Inter-Medium' }}>Sign in</Text>
            </Text>
          </Pressable>
        </View>
      )}

      {/* Signed-in empty-suitcase CTA */}
      {session && suitcaseHydrated && itemCount === 0 && (
        <View style={{ padding: layout.screenPadding }}>
          <Pressable
            onPress={() => router.push('/(tabs)/pieces')}
            style={{ backgroundColor: colors.cream + '14', borderRadius: 12, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: colors.cream + '20' }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 16, color: colors.cream }}>
              Browse All Pieces →
            </Text>
          </Pressable>
        </View>
      )}

      {/* Universal bottom clearance — keeps nav pill from covering any content */}
      <View style={{ height: insets.bottom + 100 }} />
    </ScrollView>
  )
}
