import { useState, useEffect } from 'react'
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/store/authStore'
import { useUpdateProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/Button'
import { colors } from '@/constants/colors'
import { completeProfileSchema, type CompleteProfileFormData } from '@/utils/schemas'

export default function CompleteProfileScreen() {
  const { session, profile } = useAuthStore()
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile()

  // Pre-check terms if the user already accepted during signup
  const [termsAccepted, setTermsAccepted] = useState(!!profile?.terms_accepted_at)
  const [serverError, setServerError] = useState<string | null>(null)

  // Redirect unauthenticated users — shouldn't normally reach this screen but guard anyway
  useEffect(() => {
    if (!session) router.replace('/(auth)/login')
  }, [session])

  const { control, handleSubmit, formState: { errors } } = useForm<CompleteProfileFormData>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      // Pre-populate from existing profile so users who set their name at signup don't see a blank form
      full_name: profile?.full_name ?? '',
      phone:     profile?.phone ?? '',
      shipping_address: { line1: '', line2: '', city: '', state: '', zip: '' },
    },
  })

  const onSubmit = async (data: CompleteProfileFormData) => {
    if (!session?.user.id) return
    setServerError(null)
    try {
      await updateProfile({
        userId: session.user.id,
        updates: {
          full_name: data.full_name,
          phone: data.phone || undefined,
          shipping_address: data.shipping_address,
          terms_accepted_at: new Date().toISOString(),
        },
      })
      router.replace('/(tabs)')
    } catch {
      setServerError('Something went wrong. Please try again.')
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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

        <View style={{ gap: 16 }}>
          <Controller name="full_name" control={control} render={({ field }) => (
            <View>
              <Text style={labelStyle}>Full name</Text>
              <TextInput
                style={[inputStyle, errors.full_name && errorBorderStyle]}
                placeholder="Alex Johnson"
                placeholderTextColor={colors.gray400}
                autoCapitalize="words"
                onChangeText={field.onChange}
                value={field.value}
              />
              {errors.full_name && <Text style={errorTextStyle}>{errors.full_name.message}</Text>}
            </View>
          )} />

          <Controller name="shipping_address.line1" control={control} render={({ field }) => (
            <View>
              <Text style={labelStyle}>Street address</Text>
              <TextInput
                style={[inputStyle, errors.shipping_address?.line1 && errorBorderStyle]}
                placeholder="123 Main Street"
                placeholderTextColor={colors.gray400}
                autoCapitalize="words"
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
                style={inputStyle}
                placeholder="Apt 2B"
                placeholderTextColor={colors.gray400}
                onChangeText={field.onChange}
                value={field.value ?? ''}
              />
            </View>
          )} />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 2 }}>
              <Controller name="shipping_address.city" control={control} render={({ field }) => (
                <View>
                  <Text style={labelStyle}>City</Text>
                  <TextInput
                    style={[inputStyle, errors.shipping_address?.city && errorBorderStyle]}
                    placeholder="Fairfield"
                    placeholderTextColor={colors.gray400}
                    autoCapitalize="words"
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
                    style={[inputStyle, errors.shipping_address?.state && errorBorderStyle]}
                    placeholder="CT"
                    placeholderTextColor={colors.gray400}
                    autoCapitalize="characters"
                    maxLength={2}
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
                    style={[inputStyle, errors.shipping_address?.zip && errorBorderStyle]}
                    placeholder="06824"
                    placeholderTextColor={colors.gray400}
                    keyboardType="numeric"
                    maxLength={5}
                    onChangeText={field.onChange}
                    value={field.value}
                  />
                  {errors.shipping_address?.zip && <Text style={errorTextStyle}>{errors.shipping_address.zip.message}</Text>}
                </View>
              )} />
            </View>
          </View>

          <Controller name="phone" control={control} render={({ field }) => (
            <View>
              <Text style={labelStyle}>Phone <Text style={{ color: colors.slate }}>(optional — for shipping updates)</Text></Text>
              <TextInput
                style={inputStyle}
                placeholder="(203) 555-0100"
                placeholderTextColor={colors.gray400}
                keyboardType="phone-pad"
                onChangeText={field.onChange}
                value={field.value ?? ''}
              />
            </View>
          )} />

          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 8 }}>
            <Pressable
              onPress={() => setTermsAccepted(a => !a)}
              style={{
                width: 22, height: 22, borderWidth: 1.5,
                borderColor: termsAccepted ? colors.navy : colors.gray400,
                borderRadius: 4,
                backgroundColor: termsAccepted ? colors.navy : 'transparent',
                alignItems: 'center', justifyContent: 'center', marginTop: 2,
              }}
            >
              {termsAccepted && <Text style={{ color: colors.cream, fontSize: 13, fontFamily: 'Inter-Medium' }}>✓</Text>}
            </Pressable>
            <Text style={{ flex: 1, fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, lineHeight: 18 }}>
              I agree to the{' '}
              <Text
                style={{ color: colors.navy, fontFamily: 'Inter-Medium', textDecorationLine: 'underline' }}
                onPress={() => router.push('/rental-terms' as any)}
              >
                Rental Terms
              </Text>
              {' '}— 30-day minimum per piece, monthly billing, $75 refundable deposit.
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

const labelStyle = { fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy, marginBottom: 6 } as const
const inputStyle = {
  borderWidth: 1.5, borderColor: colors.sand, borderRadius: 10,
  padding: 14, fontFamily: 'Inter-Regular', fontSize: 16, color: colors.navy,
  backgroundColor: colors.white,
} as const
const errorBorderStyle = { borderColor: colors.error } as const
const errorTextStyle = { color: colors.error, fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 4 } as const
