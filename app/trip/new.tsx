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
  event: 'My Event',
  vacation: 'Vacation',
  extended_stay: 'Extended Stay',
  season: 'Fall Semester',
}

const STEP_TITLES = ['What kind of trip?', 'Tell us about it', "What's on the agenda?"]
const TOTAL_STEPS = 3

export default function NewTripScreen() {
  const insets = useSafeAreaInsets()
  const { session } = useAuthStore()
  const { mutateAsync: createTrip, isPending } = useCreateTrip()

  useEffect(() => {
    if (!session) router.replace('/(auth)/login' as any)
  }, [session])

  const [step, setStep] = useState(0)
  const [tripType, setTripType] = useState<TripType | null>(null)
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
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
        user_id: session.user.id,
        name: name.trim() || DEFAULT_NAMES[tripType],
        type: tripType,
        destination: destination.trim() || null,
        start_date: startDate.trim() || null,
        end_date: endDate.trim() || null,
        occasions: occasions.length > 0 ? occasions : null,
      })
      router.replace({ pathname: '/trip/[id]', params: { id: trip.id } } as any)
    } catch {
      Alert.alert('Something went wrong', 'Could not create your trip. Please try again.')
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
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate }}>
            {step + 1} / {TOTAL_STEPS}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={{ height: 2, backgroundColor: colors.gray200, marginHorizontal: layout.screenPadding }}>
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
          {/* Step 0: Trip type */}
          {step === 0 && (
            <TripTypeSelector value={tripType} onChange={handleTypeSelect} />
          )}

          {/* Step 1: Details */}
          {step === 1 && tripType && (
            <View style={{ gap: 20 }}>
              <View style={{ gap: 8 }}>
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.navy }}>Trip name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={DEFAULT_NAMES[tripType]}
                  placeholderTextColor={colors.gray400}
                  style={{
                    backgroundColor: colors.white,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.sand + '80',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontFamily: 'Inter-Regular',
                    fontSize: 15,
                    color: colors.navy,
                  }}
                />
              </View>

              <View style={{ gap: 8 }}>
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.navy }}>
                  Destination <Text style={{ color: colors.slate, fontFamily: 'Inter-Regular' }}>(optional)</Text>
                </Text>
                <TextInput
                  value={destination}
                  onChangeText={setDestination}
                  placeholder="Nashville, TN"
                  placeholderTextColor={colors.gray400}
                  style={{
                    backgroundColor: colors.white,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.sand + '80',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontFamily: 'Inter-Regular',
                    fontSize: 15,
                    color: colors.navy,
                  }}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1, gap: 8 }}>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.navy }}>
                    Start date <Text style={{ color: colors.slate, fontFamily: 'Inter-Regular' }}>(optional)</Text>
                  </Text>
                  <TextInput
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.gray400}
                    style={{
                      backgroundColor: colors.white,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.sand + '80',
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontFamily: 'Inter-Regular',
                      fontSize: 15,
                      color: colors.navy,
                    }}
                  />
                </View>
                <View style={{ flex: 1, gap: 8 }}>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.navy }}>
                    End date <Text style={{ color: colors.slate, fontFamily: 'Inter-Regular' }}>(optional)</Text>
                  </Text>
                  <TextInput
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.gray400}
                    style={{
                      backgroundColor: colors.white,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.sand + '80',
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontFamily: 'Inter-Regular',
                      fontSize: 15,
                      color: colors.navy,
                    }}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Step 2: Occasions */}
          {step === 2 && tripType && (
            <View style={{ gap: 16 }}>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, lineHeight: 21 }}>
                Select everything you'll need to dress for. We'll help you browse the right pieces.
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
                {step === TOTAL_STEPS - 1 ? 'Create Trip →' : 'Continue →'}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
