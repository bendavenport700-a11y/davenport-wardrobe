import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, Pressable, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/store/authStore'
import { useCreateTrip } from '@/hooks/useTrips'
import type { TripType } from '@/types'
import { colors } from '@/constants/colors'
import { layout } from '@/constants/layout'

// ── Data ──────────────────────────────────────────────────────────────────────

const TYPES = [
  { type: 'event'         as TripType, icon: 'calendar-outline'  as const, label: 'Event',         sub: 'Wedding, conference, dinner, occasion' },
  { type: 'vacation'      as TripType, icon: 'airplane-outline'  as const, label: 'Vacation',      sub: 'Travel, weekend getaway, trip' },
  { type: 'extended_stay' as TripType, icon: 'home-outline'      as const, label: 'Extended Stay', sub: 'Semester, work assignment, relocation' },
  { type: 'season'        as TripType, icon: 'sunny-outline'     as const, label: 'Season',        sub: 'Seasonal rotation, wardrobe refresh' },
] as const

const DEFAULT_NAMES: Record<TripType, string> = {
  event:         'My Event',
  vacation:      'Vacation',
  extended_stay: 'Extended Stay',
  season:        'Fall Semester',
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function NewPlanScreen() {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const { session } = useAuthStore()
  const { mutateAsync: createTrip, isPending } = useCreateTrip()

  const [tripType, setTripType] = useState<TripType | null>(null)
  const [name,     setName]     = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')

  useEffect(() => {
    if (!session) router.replace('/(auth)/login' as any)
  }, [session])

  if (!session) return null

  const sidePad  = layout.screenPadding
  const cardGap  = 10
  const cardWidth = (screenWidth - sidePad * 2 - cardGap) / 2

  async function handleCreate() {
    if (!session?.user.id || !tripType) return
    const trimmed = name.trim()
    try {
      const trip = await createTrip({
        user_id:    session.user.id,
        name:       trimmed || DEFAULT_NAMES[tripType],
        type:       tripType,
        start_date: startDate.trim() || null,
        end_date:   endDate.trim()   || null,
      })
      router.replace({ pathname: '/trip/[id]', params: { id: trip.id } } as any)
    } catch {
      Alert.alert('Something went wrong', 'Could not create your plan. Please try again.')
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, backgroundColor: colors.cream }}>

        {/* Header */}
        <View style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: sidePad,
          paddingBottom: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.sand + '55',
        }}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={16}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={22} color={colors.navy} />
          </Pressable>
          <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 24, color: colors.navy, letterSpacing: -0.3, flex: 1 }}>
            New Plan
          </Text>
        </View>

        {/* Scrollable form body */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: sidePad, paddingTop: 28, paddingBottom: 60, gap: 28 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Plan name */}
          <View style={{ gap: 8 }}>
            <Text style={{
              fontFamily: 'Inter-Medium', fontSize: 11, color: colors.slate,
              textTransform: 'uppercase', letterSpacing: 1.4,
            }}>
              Plan name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={tripType ? DEFAULT_NAMES[tripType] : 'Austin Conference, Summer Rotation, Ski Trip…'}
              placeholderTextColor={colors.gray400}
              returnKeyType="next"
              style={{
                backgroundColor: colors.white,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: colors.sand + '90',
                paddingHorizontal: 18,
                paddingVertical: 16,
                fontFamily: 'Inter-Regular',
                fontSize: 17,
                color: colors.navy,
                letterSpacing: -0.2,
              }}
            />
          </View>

          {/* Type cards */}
          <View style={{ gap: 10 }}>
            <Text style={{
              fontFamily: 'Inter-Medium', fontSize: 11, color: colors.slate,
              textTransform: 'uppercase', letterSpacing: 1.4,
            }}>
              What kind of plan?
            </Text>
            <View style={{ flexDirection: 'row', gap: cardGap }}>
              {TYPES.slice(0, 2).map(opt => (
                <TypeCard
                  key={opt.type}
                  opt={opt}
                  selected={tripType === opt.type}
                  width={cardWidth}
                  onPress={() => {
                    setTripType(opt.type)
                    if (!name) setName(DEFAULT_NAMES[opt.type])
                  }}
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
                  onPress={() => {
                    setTripType(opt.type)
                    if (!name) setName(DEFAULT_NAMES[opt.type])
                  }}
                />
              ))}
            </View>
          </View>

          {/* Dates — optional */}
          <View style={{ gap: 10 }}>
            <Text style={{
              fontFamily: 'Inter-Medium', fontSize: 11, color: colors.slate,
              textTransform: 'uppercase', letterSpacing: 1.4,
            }}>
              Dates{' '}
              <Text style={{ fontFamily: 'Inter-Regular', textTransform: 'none', letterSpacing: 0, color: colors.slate + '70' }}>
                — optional
              </Text>
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.slate + '90', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Start
                </Text>
                <TextInput
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.gray400}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="next"
                  style={{
                    backgroundColor: colors.white,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: colors.sand + '90',
                    paddingHorizontal: 14,
                    paddingVertical: 13,
                    fontFamily: 'Inter-Regular',
                    fontSize: 15,
                    color: colors.navy,
                  }}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.slate + '90', textTransform: 'uppercase', letterSpacing: 1 }}>
                  End
                </Text>
                <TextInput
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.gray400}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="done"
                  onSubmitEditing={handleCreate}
                  style={{
                    backgroundColor: colors.white,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: colors.sand + '90',
                    paddingHorizontal: 14,
                    paddingVertical: 13,
                    fontFamily: 'Inter-Regular',
                    fontSize: 15,
                    color: colors.navy,
                  }}
                />
              </View>
            </View>
          </View>

        </ScrollView>

        {/* Footer CTA */}
        <View style={{
          paddingHorizontal: sidePad,
          paddingBottom: insets.bottom + 20,
          paddingTop: 14,
          borderTopWidth: 1,
          borderTopColor: colors.sand + '50',
          backgroundColor: colors.cream,
        }}>
          <Pressable
            onPress={handleCreate}
            disabled={isPending || !tripType}
            accessibilityRole="button"
            style={({ pressed }) => ({
              backgroundColor: tripType ? colors.navy : colors.gray200,
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
                color: tripType ? colors.cream : colors.gray400,
                letterSpacing: -0.1,
              }}>
                Create Plan →
              </Text>
            )}
          </Pressable>
        </View>

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
