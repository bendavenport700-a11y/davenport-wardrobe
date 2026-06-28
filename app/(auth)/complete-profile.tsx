import { useState, useEffect } from 'react'
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/store/authStore'
import { useUpdateProfile } from '@/hooks/useProfile'
import { GenderToggle } from '@/components/ui/GenderToggle'
import { Button } from '@/components/ui/Button'
import { useWomensEnabled } from '@/hooks/useAppSettings'
import { colors } from '@/constants/colors'
import { completeProfileSchema, type CompleteProfileFormData } from '@/utils/schemas'
import { DEPOSIT_CENTS } from '@/constants/billing'
import { formatCents } from '@/utils/format'

export default function CompleteProfileScreen() {
  const { session, profile } = useAuthStore()
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile()
  const womensEnabled = useWomensEnabled()
  const [termsAccepted, setTermsAccepted] = useState(!!profile?.terms_accepted_at)
  const [serverError, setServerError] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)
  const [genderPreference, setGenderPreference] = useState<'men' | 'women' | 'all'>(
    (profile?.gender_preference as 'men' | 'women' | 'all' | undefined) ?? 'men'
  )

  useEffect(() => {
    if (profile?.terms_accepted_at) setTermsAccepted(true)
  }, [profile?.terms_accepted_at])

  useEffect(() => {
    if (!session) router.replace('/(auth)/login')
  }, [session])

  const existingAddr = profile?.shipping_address as { line1?: string; line2?: string; city?: string; state?: string; zip?: string } | null

  const { control, handleSubmit, formState: { errors } } = useForm<CompleteProfileFormData>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      phone:     profile?.phone ?? '',
      shipping_address: {
        line1: existingAddr?.line1 ?? '',
        line2: existingAddr?.line2 ?? '',
        city:  existingAddr?.city  ?? '',
        state: existingAddr?.state ?? '',
        zip:   existingAddr?.zip   ?? '',
      },
    },
  })

  const onSubmit = async (data: CompleteProfileFormData) => {
    if (!session?.user.id) return
    if (!termsAccepted) { setServerError('Please accept the Rental Terms to continue.'); return }
    setServerError(null)
    try {
      await updateProfile({
        userId: session.user.id,
        updates: {
          full_name: data.full_name,
          phone: data.phone || undefined,
          shipping_address: data.shipping_address,
          terms_accepted_at: new Date().toISOString(),
          ...(womensEnabled ? { gender_preference: genderPreference } : {}),
        },
      })
      router.replace('/(tabs)')
    } catch {
      setServerError('Something went wrong. Please try again.')
    }
  }

  const inputStyle = (name: string, hasError: boolean) => ({
    borderWidth: 1.5,
    borderColor: hasError ? colors.error : focused === name ? colors.navy : colors.sand,
    borderRadius: 12,
    padding: 14,
    fontFamily: 'Inter-Regular' as const,
    fontSize: 16,
    color: colors.navy,
    backgroundColor: colors.white,
  })

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.cream }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 28, color: colors.navy, marginBottom: 8, marginTop: 24 }}>
          One more step.
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 16, color: colors.slate, marginBottom: 32 }}>
          Where should we ship your pieces?
        </Text>

        {serverError && (
          <View style={{ backgroundColor: colors.error + '15', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <Text style={{ color: colors.error, fontFamily: 'Inter-Regular', fontSize: 14 }}>{serverError}</Text>
          </View>
        )}

        <View style={{ gap: 20 }}>

          {/* Full name */}
          <Controller name="full_name" control={control} render={({ field }) => (
            <View>
              <Text style={labelStyle}>Full name</Text>
              <TextInput
                style={inputStyle('full_name', !!errors.full_name)}
                placeholder="Alex Johnson"
                placeholderTextColor={colors.gray400}
                autoCapitalize="words"
                textContentType="name"
                autoComplete="name"
                onFocus={() => setFocused('full_name')}
                onBlur={() => { setFocused(null); field.onBlur() }}
                onChangeText={field.onChange}
                value={field.value}
              />
              {errors.full_name && <Text style={errorTextStyle}>{errors.full_name.message}</Text>}
            </View>
          )} />

          {/* Address section */}
          <View>
            <Text style={sectionLabelStyle}>Shipping address</Text>
            <View style={{ gap: 10 }}>

              <Controller name="shipping_address.line1" control={control} render={({ field }) => (
                <View>
                  <Text style={labelStyle}>Street address</Text>
                  <TextInput
                    style={inputStyle('line1', !!errors.shipping_address?.line1)}
                    placeholder="123 Main Street"
                    placeholderTextColor={colors.gray400}
                    autoCapitalize="words"
                    textContentType="streetAddressLine1"
                    autoComplete="street-address"
                    onFocus={() => setFocused('line1')}
                    onBlur={() => { setFocused(null); field.onBlur() }}
                    onChangeText={field.onChange}
                    value={field.value}
                  />
                  {errors.shipping_address?.line1 && <Text style={errorTextStyle}>{errors.shipping_address.line1.message}</Text>}
                </View>
              )} />

              <Controller name="shipping_address.line2" control={control} render={({ field }) => (
                <View>
                  <Text style={labelStyle}>Apt / Unit <Text style={{ color: colors.slate }}>(optional)</Text></Text>
                  <TextInput
                    style={inputStyle('line2', false)}
                    placeholder="Apt 2B"
                    placeholderTextColor={colors.gray400}
                    textContentType="streetAddressLine2"
                    onFocus={() => setFocused('line2')}
                    onBlur={() => { setFocused(null); field.onBlur() }}
                    onChangeText={field.onChange}
                    value={field.value ?? ''}
                  />
                </View>
              )} />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 2 }}>
                  <Controller name="shipping_address.city" control={control} render={({ field }) => (
                    <View>
                      <Text style={labelStyle}>City</Text>
                      <TextInput
                        style={inputStyle('city', !!errors.shipping_address?.city)}
                        placeholder="Fairfield"
                        placeholderTextColor={colors.gray400}
                        autoCapitalize="words"
                        textContentType="addressCity"
                        autoComplete="address-line2"
                        onFocus={() => setFocused('city')}
                        onBlur={() => { setFocused(null); field.onBlur() }}
                        onChangeText={field.onChange}
                        value={field.value}
                      />
                      {errors.shipping_address?.city && <Text style={errorTextStyle}>{errors.shipping_address.city.message}</Text>}
                    </View>
                  )} />
                </View>
                <View style={{ flex: 1 }}>
                  <Controller name="shipping_address.state" control={control} render={({ field }) => (
                    <View>
                      <Text style={labelStyle}>State</Text>
                      <TextInput
                        style={inputStyle('state', !!errors.shipping_address?.state)}
                        placeholder="CT"
                        placeholderTextColor={colors.gray400}
                        autoCapitalize="characters"
                        maxLength={2}
                        textContentType="addressState"
                        autoComplete="address-line1"
                        onFocus={() => setFocused('state')}
                        onBlur={() => { setFocused(null); field.onBlur() }}
                        onChangeText={v => field.onChange(v.toUpperCase())}
                        value={field.value}
                      />
                      {errors.shipping_address?.state && <Text style={errorTextStyle}>{errors.shipping_address.state.message}</Text>}
                    </View>
                  )} />
                </View>
                <View style={{ flex: 1 }}>
                  <Controller name="shipping_address.zip" control={control} render={({ field }) => (
                    <View>
                      <Text style={labelStyle}>ZIP</Text>
                      <TextInput
                        style={inputStyle('zip', !!errors.shipping_address?.zip)}
                        placeholder="06824"
                        placeholderTextColor={colors.gray400}
                        keyboardType="numeric"
                        maxLength={5}
                        textContentType="postalCode"
                        autoComplete="postal-code"
                        onFocus={() => setFocused('zip')}
                        onBlur={() => { setFocused(null); field.onBlur() }}
                        onChangeText={field.onChange}
                        value={field.value}
                      />
                      {errors.shipping_address?.zip && <Text style={errorTextStyle}>{errors.shipping_address.zip.message}</Text>}
                    </View>
                  )} />
                </View>
              </View>
            </View>
          </View>

          {/* Phone */}
          <Controller name="phone" control={control} render={({ field }) => (
            <View>
              <Text style={labelStyle}>Phone <Text style={{ color: colors.slate }}>(optional — for shipping updates)</Text></Text>
              <TextInput
                style={inputStyle('phone', false)}
                placeholder="(203) 555-0100"
                placeholderTextColor={colors.gray400}
                keyboardType="phone-pad"
                textContentType="telephoneNumber"
                autoComplete="tel"
                onFocus={() => setFocused('phone')}
                onBlur={() => { setFocused(null); field.onBlur() }}
                onChangeText={field.onChange}
                value={field.value ?? ''}
              />
            </View>
          )} />

          {/* Gender preference — only shown when women's line is enabled */}
          {womensEnabled && (
            <View style={{ gap: 10 }}>
              <Text style={sectionLabelStyle}>What are you shopping for?</Text>
              <GenderToggle value={genderPreference} onChange={setGenderPreference} />
            </View>
          )}

          {/* Terms */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <Pressable
              onPress={() => setTermsAccepted(a => !a)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: termsAccepted }}
              accessibilityLabel="Accept rental terms"
              style={{
                width: 22, height: 22, borderWidth: 1.5,
                borderColor: termsAccepted ? colors.navy : colors.gray400,
                borderRadius: 4,
                backgroundColor: termsAccepted ? colors.navy : 'transparent',
                alignItems: 'center', justifyContent: 'center', marginTop: 2,
              }}
            >
              {termsAccepted && <Ionicons name="checkmark" size={14} color={colors.cream} />}
            </Pressable>
            <Text style={{ flex: 1, fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, lineHeight: 18 }}>
              I agree to the{' '}
              <Text
                style={{ color: colors.navy, fontFamily: 'Inter-Medium', textDecorationLine: 'underline' }}
                onPress={() => router.push('/rental-terms' as any)}
                accessibilityRole="link"
                accessibilityLabel="View rental terms"
              >
                Rental Terms
              </Text>
              {' '}({formatCents(DEPOSIT_CENTS)} refundable deposit, billed every 30 days).
            </Text>
          </View>

          <Button
            label="Let's go →"
            onPress={handleSubmit(onSubmit)}
            loading={isPending}
            disabled={!termsAccepted}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const labelStyle      = { fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy, marginBottom: 6 } as const
const sectionLabelStyle = { fontFamily: 'Inter-Medium', fontSize: 11, color: colors.slate, letterSpacing: 1.3, textTransform: 'uppercase' as const, marginBottom: 10 }
const errorTextStyle  = { color: colors.error, fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 4 } as const
