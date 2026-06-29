import { useState, useEffect, useRef } from 'react'
import {
  View, Text, ScrollView, Pressable, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInRight, FadeOutLeft, FadeInLeft, FadeOutRight, Layout } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/store/authStore'
import { useCreateTrip } from '@/hooks/useTrips'
import type { TripType } from '@/types'
import { colors } from '@/constants/colors'
import { layout } from '@/constants/layout'

// ── Data ──────────────────────────────────────────────────────────────────────

const TYPES = [
  { type: 'event'        as TripType, icon: 'calendar-outline'  as const, label: 'Event',         sub: 'Wedding, dinner, conference' },
  { type: 'vacation'     as TripType, icon: 'airplane-outline'  as const, label: 'Vacation',      sub: 'Trip, weekend getaway' },
  { type: 'extended_stay'as TripType, icon: 'home-outline'      as const, label: 'Extended Stay', sub: 'Semester, work assignment' },
  { type: 'season'       as TripType, icon: 'sunny-outline'     as const, label: 'Season',        sub: 'Seasonal wardrobe refresh' },
] as const

const DEFAULT_NAMES: Record<TripType, string> = {
  event:         'My Event',
  vacation:      'Vacation',
  extended_stay: 'Extended Stay',
  season:        'Fall Semester',
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function NewPlanScreen() {
  const insets   = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const { session } = useAuthStore()
  const { mutateAsync: createTrip, isPending } = useCreateTrip()
  const nameRef = useRef<TextInput>(null)

  useEffect(() => {
    if (!session) router.replace('/(auth)/login' as any)
  }, [session])

  const [step,     setStep]     = useState(0)
  const [tripType, setTripType] = useState<TripType | null>(null)
  const [name,     setName]     = useState('')

  if (!session) return null

  // Card width: screen minus horizontal padding, split into 2 with gap
  const cardGap  = 12
  const sidePad  = layout.screenPadding
  const cardWidth = (screenWidth - sidePad * 2 - cardGap) / 2

  function handleTypeSelect(type: TripType) {
    setTripType(type)
    if (!name) setName(DEFAULT_NAMES[type])
    // Small delay so user sees the selection highlight before advancing
    setTimeout(() => {
      setStep(1)
      setTimeout(() => nameRef.current?.focus(), 350)
    }, 160)
  }

  async function handleCreate() {
    if (!session?.user.id || !tripType) return
    const trimmed = name.trim()
    try {
      const trip = await createTrip({
        user_id: session.user.id,
        name:    trimmed || DEFAULT_NAMES[tripType],
        type:    tripType,
      })
      router.replace({ pathname: '/trip/[id]', params: { id: trip.id } } as any)
    } catch {
      Alert.alert('Something went wrong', 'Could not create your plan. Please try again.')
    }
  }

  const selectedMeta = TYPES.find(t => t.type === tripType)

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, backgroundColor: colors.cream }}>

        {/* ── Header ── */}
        <View style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: sidePad,
          paddingBottom: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
          <Pressable
            onPress={() => step === 0 ? router.back() : setStep(0)}
            hitSlop={16}
            accessibilityRole="button"
            accessibilityLabel={step === 0 ? 'Close' : 'Back'}
          >
            <Ionicons
              name={step === 0 ? 'close' : 'arrow-back'}
              size={22}
              color={colors.navy}
            />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: colors.navy, letterSpacing: -0.4 }}>
              {step === 0 ? 'What kind of plan?' : 'Name your plan'}
            </Text>
          </View>

          {/* Step dots */}
          <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
            {[0, 1].map(i => (
              <View key={i} style={{
                width: i === step ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === step ? colors.navy : colors.sand + '80',
              }} />
            ))}
          </View>
        </View>

        {/* Progress bar */}
        <View style={{ height: 2, backgroundColor: colors.sand + '50', marginHorizontal: sidePad, borderRadius: 1 }}>
          <Animated.View layout={Layout.springify()} style={{
            height: 2,
            backgroundColor: colors.navy,
            borderRadius: 1,
            width: step === 0 ? '50%' : '100%',
          }} />
        </View>

        {/* ── Step 0: Type selector ── */}
        {step === 0 && (
          <Animated.ScrollView
            entering={FadeInRight.duration(220)}
            exiting={FadeOutLeft.duration(180)}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: sidePad, paddingTop: 22, paddingBottom: 60, gap: cardGap }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ flexDirection: 'row', gap: cardGap }}>
              {TYPES.slice(0, 2).map(opt => (
                <TypeCard
                  key={opt.type}
                  opt={opt}
                  selected={tripType === opt.type}
                  width={cardWidth}
                  onPress={() => handleTypeSelect(opt.type)}
                />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: cardGap }}>
              {TYPES.slice(2, 4).map(opt => (
                <TypeCard
                  key={opt.type}
                  opt={opt}
                  selected={tripType === opt.type}
                  width={cardWidth}
                  onPress={() => handleTypeSelect(opt.type)}
                />
              ))}
            </View>

            <Text style={{
              fontFamily: 'Inter-Regular', fontSize: 12,
              color: colors.slate + '60', textAlign: 'center', marginTop: 8,
            }}>
              Tap to select — you'll name it next
            </Text>
          </Animated.ScrollView>
        )}

        {/* ── Step 1: Name + create ── */}
        {step === 1 && (
          <Animated.ScrollView
            entering={FadeInRight.duration(220)}
            exiting={FadeOutLeft.duration(180)}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: sidePad, paddingTop: 28, paddingBottom: 60, gap: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Selected type recap */}
            {selectedMeta && (
              <Pressable
                onPress={() => setStep(0)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  backgroundColor: colors.navy + '08',
                  borderRadius: 14, padding: 14,
                  borderWidth: 1, borderColor: colors.navy + '15',
                  alignSelf: 'flex-start',
                }}
              >
                <View style={{
                  width: 32, height: 32, borderRadius: 9,
                  backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name={selectedMeta.icon} size={16} color={colors.cream} />
                </View>
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy }}>
                  {selectedMeta.label}
                </Text>
                <Ionicons name="chevron-down" size={13} color={colors.navy + '60'} />
              </Pressable>
            )}

            {/* Name input */}
            <View style={{ gap: 8 }}>
              <Text style={{
                fontFamily: 'Inter-Medium', fontSize: 11, color: colors.slate,
                textTransform: 'uppercase', letterSpacing: 1.2,
              }}>
                Plan name
              </Text>
              <TextInput
                ref={nameRef}
                value={name}
                onChangeText={setName}
                placeholder={tripType ? DEFAULT_NAMES[tripType] : 'Name this plan'}
                placeholderTextColor={colors.gray400}
                returnKeyType="done"
                onSubmitEditing={handleCreate}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: colors.sand + '90',
                  paddingHorizontal: 18,
                  paddingVertical: 16,
                  fontFamily: 'Inter-Regular',
                  fontSize: 18,
                  color: colors.navy,
                  letterSpacing: -0.2,
                }}
              />
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate + '60' }}>
                You can add dates and pieces after creating.
              </Text>
            </View>
          </Animated.ScrollView>
        )}

        {/* ── Footer CTA (step 1 only) ── */}
        {step === 1 && (
          <Animated.View
            entering={FadeInRight.delay(60).duration(220)}
            style={{
              paddingHorizontal: sidePad,
              paddingBottom: insets.bottom + 20,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: colors.sand + '50',
              backgroundColor: colors.cream,
            }}
          >
            <Pressable
              onPress={handleCreate}
              disabled={isPending || !name.trim()}
              accessibilityRole="button"
              style={({ pressed }) => ({
                backgroundColor: name.trim() ? colors.navy : colors.gray200,
                borderRadius: 16,
                paddingVertical: 17,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                opacity: pressed ? 0.88 : 1,
              })}
            >
              {isPending ? (
                <ActivityIndicator color={colors.cream} />
              ) : (
                <Text style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 16,
                  color: name.trim() ? colors.cream : colors.gray400,
                  letterSpacing: -0.1,
                }}>
                  Create Plan →
                </Text>
              )}
            </Pressable>
          </Animated.View>
        )}

      </View>
    </KeyboardAvoidingView>
  )
}

// ── TypeCard ──────────────────────────────────────────────────────────────────

function TypeCard({
  opt,
  selected,
  width,
  onPress,
}: {
  opt: typeof TYPES[number]
  selected: boolean
  width: number
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => ({
        width,
        padding: 18,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: selected ? colors.navy : colors.sand + '90',
        backgroundColor: selected ? colors.navy : colors.white,
        opacity: pressed ? 0.85 : 1,
        gap: 14,
        // Subtle shadow on unselected
        shadowColor: colors.navy,
        shadowOpacity: selected ? 0 : 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: selected ? 0 : 2,
      })}
    >
      <View style={{
        width: 40, height: 40, borderRadius: 11,
        backgroundColor: selected ? colors.cream + '22' : colors.navy + '0A',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons
          name={opt.icon}
          size={20}
          color={selected ? colors.cream : colors.navy}
        />
      </View>
      <View style={{ gap: 3 }}>
        <Text style={{
          fontFamily: 'Inter-Bold', fontSize: 15,
          color: selected ? colors.cream : colors.navy,
          letterSpacing: -0.3,
        }}>
          {opt.label}
        </Text>
        <Text style={{
          fontFamily: 'Inter-Regular', fontSize: 12,
          color: selected ? colors.cream + 'AA' : colors.slate,
          lineHeight: 17,
        }}>
          {opt.sub}
        </Text>
      </View>
      {selected && (
        <View style={{
          position: 'absolute', top: 12, right: 12,
          width: 20, height: 20, borderRadius: 10,
          backgroundColor: colors.cream + '22',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Ionicons name="checkmark" size={12} color={colors.cream} />
        </View>
      )}
    </Pressable>
  )
}
