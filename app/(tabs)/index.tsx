import { ScrollView, View, Text, Pressable, Linking } from 'react-native'
import { router } from 'expo-router'
import { useState, useEffect, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useQueryClient } from '@tanstack/react-query'
import { useWardrobes } from '@/hooks/useWardrobes'
import { useFeaturedPieces } from '@/hooks/useFeaturedPieces'
import { useSavedWardrobes } from '@/hooks/useSavedWardrobes'
import { useAuthStore } from '@/store/authStore'
import { useSuitcaseStore, useSuitcaseHydrated } from '@/store/suitcaseStore'
import { WardrobeCard } from '@/components/wardrobe/WardrobeCard'
import { WardrobeCardSkeleton, PieceCardSkeleton } from '@/components/ui/Skeleton'
import { PieceCard } from '@/components/piece/PieceCard'
import { HowItWorksStrip } from '@/components/home/HowItWorksStrip'
import { colors } from '@/constants/colors'
import { layout, DEFAULT_BLURHASH } from '@/constants/layout'

const WELCOME_KEY = 'davenport:welcome_seen'

export default function HomeScreen() {
  const { session, profile } = useAuthStore()
  const userId = session?.user.id
  const itemCount = useSuitcaseStore(s => s.items.length)
  const suitcaseHydrated = useSuitcaseHydrated()
  const queryClient = useQueryClient()
  const { data: savedWardrobes } = useSavedWardrobes(userId)
  const { data: wardrobes, isLoading: wardrobesLoading, isError: wardrobesError } = useWardrobes()
  const { data: featured, isLoading: featuredLoading, isError: featuredError } = useFeaturedPieces()
  const firstWardrobe = wardrobes?.[0]

  const [welcomeDismissed, setWelcomeDismissed] = useState(true)

  // Auto-scrolling refs + state
  const wardrobeScrollRef  = useRef<ScrollView>(null)
  const whyRentScrollRef   = useRef<ScrollView>(null)
  const [wardrobeIdx, setWardrobeIdx]   = useState(0)
  const [whyRentIdx, setWhyRentIdx]     = useState(0)
  const wardrobeUserScrolling = useRef(false)
  const whyRentUserScrolling  = useRef(false)
  const WARDROBE_ITEM_W = 232   // 220 card + 12 gap
  const WHY_RENT_ITEM_W = 190   // 180 card + 10 gap
  const WHY_RENT_COUNT  = 4

  // Wardrobes: auto-advance every 3s, pause while user is dragging
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

  // Why Rent: auto-advance every 3.5s
  useEffect(() => {
    const t = setInterval(() => {
      if (whyRentUserScrolling.current) return
      setWhyRentIdx(prev => {
        const next = (prev + 1) % WHY_RENT_COUNT
        whyRentScrollRef.current?.scrollTo({ x: next * WHY_RENT_ITEM_W, animated: true })
        return next
      })
    }, 3500)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!session || (profile?.active_rental_count ?? 0) > 0) return
    const signedUpAt = new Date(profile?.created_at ?? 0)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    if (signedUpAt < sevenDaysAgo) return
    AsyncStorage.getItem(WELCOME_KEY).then(val => {
      if (!val) setWelcomeDismissed(false)
    })
  }, [session, profile])

  const dismissWelcome = () => {
    setWelcomeDismissed(true)
    AsyncStorage.setItem(WELCOME_KEY, 'true')
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.cream }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.navy }}>
        {firstWardrobe?.cover_image_url ? (
          <Image
            source={firstWardrobe.cover_image_url}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            placeholder={DEFAULT_BLURHASH}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 48, color: colors.cream }}>D</Text>
          </View>
        )}
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: layout.screenPadding, backgroundColor: 'rgba(27,42,74,0.55)',
          alignItems: 'center',
        }}>
          <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 30, color: colors.cream, letterSpacing: 6, textAlign: 'center' }}>
            DAVENPORT
          </Text>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 16, color: colors.sand, marginTop: 4, textAlign: 'center' }}>
            Try it. Rent it. Own it — if you want to.
          </Text>
        </View>
      </View>

      {/* Live inventory strip */}
      <View style={{
        backgroundColor: colors.navy + '0A',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 10, gap: 8,
        borderBottomWidth: 1, borderBottomColor: colors.sand + '60',
      }}>
        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.success }} />
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate }}>
          New pieces added every week — inventory is live and growing
        </Text>
      </View>

      <HowItWorksStrip />

      {/* Welcome banner — new signed-in users, 0 rentals, within first 7 days */}
      {session && !welcomeDismissed && (
        <Animated.View entering={FadeInDown.springify()} style={{
          margin: layout.screenPadding,
          marginBottom: 0,
          backgroundColor: colors.navy,
          borderRadius: 14,
          padding: 18,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 18, color: colors.cream, marginBottom: 4 }}>
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

      {/* Wardrobes */}
      <View style={{ paddingTop: 20, paddingBottom: 20 }}>
        <View style={{ paddingHorizontal: layout.screenPadding, marginBottom: 14, gap: 2 }}>
          <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 22, color: colors.navy }}>
            The Wardrobes
          </Text>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate }}>
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
              style={{ paddingHorizontal: layout.screenPadding, paddingVertical: 12 }}>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate }}>
                Couldn't load wardrobes — tap to retry
              </Text>
            </Pressable>
          ) : wardrobesLoading
            ? [0, 1].map(i => <WardrobeCardSkeleton key={i} />)
            : wardrobes && wardrobes.length === 0
            ? (
              <View style={{ paddingHorizontal: layout.screenPadding, paddingVertical: 12 }}>
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
        {/* Dots */}
        {(wardrobes?.length ?? 0) > 1 && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 10 }}>
            {wardrobes!.map((_, i) => (
              <View key={i} style={{
                height: 5, borderRadius: 2.5,
                width: i === wardrobeIdx ? 16 : 5,
                backgroundColor: i === wardrobeIdx ? colors.navy : colors.sand,
              }} />
            ))}
          </View>
        )}

        {/* Coming soon teaser */}
        <View style={{
          marginHorizontal: layout.screenPadding, marginTop: 16,
          backgroundColor: colors.navy, borderRadius: 14, padding: 16,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <View style={{ gap: 3 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.sand, textTransform: 'uppercase', letterSpacing: 1 }}>
              Coming soon
            </Text>
            <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 18, color: colors.cream }}>
              Women's styles
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.cream + 'BB', lineHeight: 17 }}>
              Workwear, casual, and occasion pieces for her.
            </Text>
          </View>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.cream + '15', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="sparkles-outline" size={22} color={colors.sand} />
          </View>
        </View>
      </View>

      {/* Saved Wardrobes — only show if user has saved at least one */}
      {session && (savedWardrobes?.length ?? 0) > 0 && (
        <View style={{ paddingTop: 8, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.screenPadding, marginBottom: 14 }}>
            <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 22, color: colors.navy }}>
              Your Wardrobes
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate }}>
              {savedWardrobes!.length} saved
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: layout.screenPadding, gap: 12 }}>
            {savedWardrobes!.map((w, i) => (
              <Animated.View key={w.id} entering={FadeInDown.delay(i * 50).springify()}>
                <WardrobeCard wardrobe={w} />
              </Animated.View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Featured Pieces */}
      <View style={{ paddingHorizontal: layout.screenPadding, paddingBottom: 24 }}>
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 22, color: colors.navy, marginBottom: 12 }}>
          Featured Pieces
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {featuredError ? (
            <Pressable onPress={() => queryClient.invalidateQueries({ queryKey: ['pieces', 'featured'] })}
              style={{ width: '100%', paddingVertical: 12 }}>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate }}>
                Couldn't load pieces — tap to retry
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

      {/* Why Rent */}
      <View style={{ paddingBottom: 28 }}>
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 22, color: colors.navy, marginBottom: 16, paddingHorizontal: layout.screenPadding }}>
          Why rent instead of buy?
        </Text>
        <ScrollView
          ref={whyRentScrollRef}
          horizontal showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => { whyRentUserScrolling.current = true }}
          onScrollEndDrag={() => { setTimeout(() => { whyRentUserScrolling.current = false }, 2000) }}
          onMomentumScrollEnd={e => setWhyRentIdx(Math.round(e.nativeEvent.contentOffset.x / WHY_RENT_ITEM_W))}
          contentContainerStyle={{ paddingHorizontal: layout.screenPadding, gap: 10 }}>
          {([
            { icon: 'swap-horizontal-outline', heading: 'Style changes.\nWardrobe should too.', body: "Never stuck with something that stopped fitting your life." },
            { icon: 'hand-left-outline',       heading: 'Try it before\nyou commit.',          body: "Wear a piece for a month, then decide. Buy at a lower price if you love it." },
            { icon: 'archive-outline',         heading: 'No closet\nclutter.',                 body: "Return what doesn't get worn. Only keep what earns its place." },
            { icon: 'trending-up-outline',     heading: 'Pay as your\nwardrobe grows.',         body: "Build slowly. No big upfront spend — rent what you need now." },
          ] as { icon: React.ComponentProps<typeof Ionicons>['name']; heading: string; body: string }[]).map((item, i) => (
            <View key={i} style={{
              backgroundColor: i === 1 ? colors.navy : colors.white,
              borderRadius: 16, padding: 18, width: 180, gap: 12,
              borderWidth: 1, borderColor: i === 1 ? 'transparent' : colors.sand,
            }}>
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: i === 1 ? colors.cream + '20' : colors.navy + '10',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name={item.icon} size={18} color={i === 1 ? colors.cream : colors.navy} />
              </View>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: i === 1 ? colors.cream : colors.navy, lineHeight: 19 }}>
                {item.heading}
              </Text>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: i === 1 ? colors.sand : colors.slate, lineHeight: 17 }}>
                {item.body}
              </Text>
            </View>
          ))}
        </ScrollView>
        {/* Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 14 }}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={{
              height: 5, borderRadius: 2.5,
              width: i === whyRentIdx ? 16 : 5,
              backgroundColor: i === whyRentIdx ? colors.navy : colors.sand,
            }} />
          ))}
        </View>
      </View>

      {/* Request inventory / feedback */}
      <View style={{ marginHorizontal: layout.screenPadding, marginBottom: 28 }}>
        <View style={{
          backgroundColor: colors.white, borderRadius: 16,
          padding: 20, borderWidth: 1, borderColor: colors.sand, gap: 12,
        }}>
          <View style={{ gap: 4 }}>
            <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 18, color: colors.navy }}>
              Don't see what you're looking for?
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, lineHeight: 20 }}>
              We're taking requests. Tell us your favorite brands, ask about specific pieces, or just say hi.
              We read every message.
            </Text>
          </View>
          <Pressable
            onPress={() => Linking.openURL('mailto:support@davenport.rentals?subject=Inventory Request')}
            accessibilityRole="button"
            accessibilityLabel="Send an inventory request"
            style={{
              backgroundColor: colors.navy, borderRadius: 10,
              paddingVertical: 12, alignItems: 'center', flexDirection: 'row',
              justifyContent: 'center', gap: 8,
            }}>
            <Ionicons name="mail-outline" size={16} color={colors.cream} />
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.cream }}>
              Send a request
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Guest CTA */}
      {!session && (
        <View style={{ padding: layout.screenPadding, paddingBottom: 40, gap: 12 }}>
          <View style={{ gap: 6, marginBottom: 12 }}>
            <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 22, color: colors.navy, textAlign: 'center' }}>
              Your wardrobe, on your terms.
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, textAlign: 'center', lineHeight: 21 }}>
              Try pieces for a month. Buy what you love at a lower price. Return the rest — no questions asked.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(auth)/signup')}
            accessibilityLabel="Create a free account"
            accessibilityRole="button"
            style={{ backgroundColor: colors.navy, borderRadius: 12, padding: 18, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 16, color: colors.cream }}>
              Create a Free Account →
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            accessibilityRole="button"
            style={{ alignItems: 'center', padding: 8 }}>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate }}>
              Already a member?{' '}
              <Text style={{ color: colors.navy, fontFamily: 'Inter-Medium' }}>Sign in</Text>
            </Text>
          </Pressable>
        </View>
      )}

      {/* Signed-in empty-suitcase CTA — only show after hydration to avoid flash */}
      {session && suitcaseHydrated && itemCount === 0 && (
        <View style={{ padding: layout.screenPadding, paddingBottom: 40 }}>
          <Pressable
            onPress={() => router.push('/(tabs)/pieces')}
            style={{ backgroundColor: colors.navy, borderRadius: 12, padding: 18, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 16, color: colors.cream }}>
              Browse All Pieces →
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  )
}
