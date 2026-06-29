import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/store/authStore'
import { useCreateTrip } from '@/hooks/useTrips'
import { TripTypeSelector } from '@/components/trip/TripTypeSelector'
import { OccasionPicker } from '@/components/trip/OccasionPicker'
import type { TripType } from '@/types'
import { colors } from '@/constants/colors'
import { layout } from '@/constants/layout'

const DEFAULT_NAMES: Record<TripType, string> = {
  event:         'My Event',
  vacation:      'Vacation',
  extended_stay: 'Extended Stay',
  season:        'Fall Semester',
}

const STEP_TITLES = ['What kind of plan?', 'Name it', "What's on the agenda?"]
const TOTAL_STEPS = 3

const inputStyle = {
  backgroundColor: colors.white,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: colors.sand + '90',
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontFamily: 'Inter-Regular' as const,
  fontSize: 15,
  color: colors.navy,
}

export default function NewPlanScreen() {
  const insets = useSafeAreaInsets()
  const { session } = useAuthStore()
  const { mutateAsync: createTrip, isPending } = useCreateTrip()

  useEffect(() => {
    if (!session) router.replace('/(auth)/login' as any)
  }, [session])

  const [step, setStep] = useState(0)
  const [tripType, setTripType] = useState<TripType | null>(null)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [occasions, setOccasions] = useState<string[]>([])

  if (!session) return null

  function handleTypeSelect(type: TripType) {
    setTripType(type)
    if (!name) setName(DEFAULT_NAMES[type])
  }

  function canAdvance() {
    if (step === 0) return tripType !== null
    if (step === 1) return name.trim().length > 0
    return true
  }

  function nextStep() {
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1)
    } else {
      handleCreate()
    }
  }

  async function handleCreate() {
    if (!session?.user.id || !tripType) return
    try {
      const trip = await createTrip({
        user_id:    session.user.id,
        name:       name.trim() || DEFAULT_NAMES[tripType],
        type:       tripType,
        start_date: startDate.trim() || null,
        end_date:   endDate.trim() || null,
        occasions:  occasions.length > 0 ? occasions : null,
        notes:      notes.trim() || null,
      })
      router.replace({ pathname: '/trip/[id]', params: { id: trip.id } } as any)
    } catch {
      Alert.alert('Something went wrong', 'Could not create your plan. Please try again.')
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.cream }}>

        {/* Header */}
        <View style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: layout.screenPadding,
          paddingBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
          <Pressable
            onPress={() => step > 0 ? setStep(s => s - 1) : router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={step > 0 ? 'Previous step' : 'Close'}
          >
            <Ionicons name={step > 0 ? 'arrow-back' : 'close'} size={22} color={colors.navy} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 17, color: colors.navy, letterSpacing: -0.3 }}>
              {STEP_TITLES[step]}
            </Text>
          </View>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate + '80' }}>
            {step + 1} / {TOTAL_STEPS}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={{ height: 2, backgroundColor: colors.sand + '60', marginHorizontal: layout.screenPadding }}>
          <View style={{
            height: 2,
            backgroundColor: colors.navy,
            width: `${Math.round(((step + 1) / TOTAL_STEPS) * 100)}%`,
          }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: layout.screenPadding, paddingTop: 24, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Step 0: Plan type */}
          {step === 0 && (
            <TripTypeSelector value={tripType} onChange={handleTypeSelect} />
          )}

          {/* Step 1: Name + dates + notes */}
          {step === 1 && tripType && (
            <View style={{ gap: 20 }}>
              {/* Name */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: colors.slate, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Plan name
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={DEFAULT_NAMES[tripType]}
                  placeholderTextColor={colors.gray400}
                  style={inputStyle}
                  autoFocus
                />
              </View>

              {/* Date range */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: colors.slate, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Dates{' '}
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate + '70', textTransform: 'none', letterSpacing: 0 }}>
                    — optional
                  </Text>
                </Text>
                <View style={{
                  backgroundColor: colors.white, borderRadius: 14,
                  borderWidth: 1, borderColor: colors.sand + '90',
                  overflow: 'hidden',
                }}>
                  <View style={{ flexDirection: 'row' }}>
                    <View style={{ flex: 1, padding: 14, borderRightWidth: 1, borderRightColor: colors.sand + '60' }}>
                      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: colors.slate + '80', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                        Start
                      </Text>
                      <TextInput
                        value={startDate}
                        onChangeText={setStartDate}
                        placeholder="Jun 29, 2026"
                        placeholderTextColor={colors.gray400}
                        style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.navy, padding: 0 }}
                        keyboardType="default"
                      />
                    </View>
                    <View style={{ flex: 1, padding: 14 }}>
                      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: colors.slate + '80', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                        End
                      </Text>
                      <TextInput
                        value={endDate}
                        onChangeText={setEndDate}
                        placeholder="Jul 4, 2026"
                        placeholderTextColor={colors.gray400}
                        style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.navy, padding: 0 }}
                        keyboardType="default"
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Notes */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: colors.slate, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Notes{' '}
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate + '70', textTransform: 'none', letterSpacing: 0 }}>
                    — optional
                  </Text>
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Dress code, weather, vibe…"
                  placeholderTextColor={colors.gray400}
                  style={{ ...inputStyle, minHeight: 80, textAlignVertical: 'top' }}
                  multiline
                />
              </View>
            </View>
          )}

          {/* Step 2: Occasions */}
          {step === 2 && tripType && (
            <View style={{ gap: 16 }}>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, lineHeight: 21 }}>
                Select what you'll need to dress for — we'll show the right pieces.
              </Text>
              <OccasionPicker
                tripType={tripType}
                selected={occasions}
                onChange={setOccasions}
              />
            </View>
          )}

        </ScrollView>

        {/* Footer CTA */}
        <View style={{
          paddingHorizontal: layout.screenPadding,
          paddingBottom: insets.bottom + 24,
          paddingTop: 16,
          backgroundColor: colors.cream,
          borderTopWidth: 1,
          borderTopColor: colors.sand + '50',
        }}>
          <Pressable
            onPress={nextStep}
            disabled={!canAdvance() || isPending}
            style={({ pressed }) => ({
              backgroundColor: canAdvance() ? colors.navy : colors.gray200,
              borderRadius: 14,
              paddingVertical: 16,
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
                color: canAdvance() ? colors.cream : colors.gray400,
              }}>
                {step === TOTAL_STEPS - 1 ? 'Create Plan →' : 'Continue →'}
              </Text>
            )}
          </Pressable>
        </View>

      </View>
    </KeyboardAvoidingView>
  )
}
