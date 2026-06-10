import { ScrollView, View, Text, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useState, useEffect } from 'react'
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
              Welcome to Davenport
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.sand, lineHeight: 20 }}>
              Build your suitcase, rent by the month, and buy what you love. No commitments.
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/pieces')}
              style={{ marginTop: 12, alignSelf: 'flex-start', backgroundColor: colors.cream, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy }}>
                Browse All Pieces →
              </Text>
            </Pressable>
          </View>
          <Pressable onPress={dismissWelcome} style={{ padding: 4 }}>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 20, color: colors.sand, lineHeight: 20 }}>×</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Wardrobes */}
      <View style={{ paddingTop: 20, paddingBottom: 20 }}>
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 22, color: colors.navy, paddingHorizontal: layout.screenPadding, marginBottom: 14 }}>
          The Wardrobes
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
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
      </View>

      {/* Guest CTA */}
      {!session && (
        <View style={{ padding: layout.screenPadding, paddingBottom: 40, gap: 12 }}>
          <View style={{ gap: 6, marginBottom: 12 }}>
            <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 22, color: colors.navy, textAlign: 'center' }}>
              No commitment. No guessing.
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, textAlign: 'center', lineHeight: 21 }}>
              Rent a piece, wear it, and decide if you want to keep it. Buy at a lower price — or send it back.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(auth)/signup')}
            accessibilityLabel="Start renting from $12 per month"
            accessibilityRole="button"
            style={{ backgroundColor: colors.navy, borderRadius: 12, padding: 18, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 16, color: colors.cream }}>
              Browse the Wardrobe →
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
