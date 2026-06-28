import { useState } from 'react'
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import { useUpdateProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/Button'
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons'
import { colors } from '@/constants/colors'
import { signupSchema, type SignupFormData } from '@/utils/schemas'

export default function SignupScreen() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)
  const { mutateAsync: updateProfile } = useUpdateProfile()

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { full_name: '', email: '', password: '', terms: false as unknown as true },
  })

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null)
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })
    if (error) {
      const isAlreadyExists = (error as any).code === 'user_already_exists' || error.message.toLowerCase().includes('already')
      setServerError(isAlreadyExists ? 'An account with this email exists. Sign in instead.' : error.message)
      return
    }
    if (authData.user && !authData.session) {
      // Email confirmation is required — session won't exist until the user confirms
      setServerError('Check your email to verify your account, then sign in.')
      return
    }
    if (authData.user) {
      try {
        await updateProfile({
          userId: authData.user.id,
          updates: {
            full_name: data.full_name,
            terms_accepted_at: new Date().toISOString(),
          },
        })
      } catch {
        console.error('Profile update failed after signup — user will retry on complete-profile')
      }
    }
  }

  const inputStyle = (name: string, hasError: boolean) => ({
    borderWidth: 1.5,
    borderColor: hasError ? colors.error : focused === name ? colors.navy : colors.sand + 'CC',
    borderRadius: 12,
    padding: 15,
    fontFamily: 'Inter-Regular' as const,
    fontSize: 16,
    color: colors.navy,
    backgroundColor: colors.white,
  })

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.cream }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 32, color: colors.navy, marginBottom: 8, letterSpacing: 0.2 }}>
          Create account.
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 16, color: colors.slate, marginBottom: 32, lineHeight: 24 }}>
          Start renting the wardrobe.
        </Text>

        {serverError && (
          <View style={{ backgroundColor: colors.error + '15', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: colors.error, fontFamily: 'Inter-Regular', fontSize: 14 }}>{serverError}</Text>
          </View>
        )}

        <View style={{ gap: 16 }}>
          <Controller name="full_name" control={control} render={({ field }) => (
            <View>
              <Text style={labelStyle}>Full name</Text>
              <TextInput
                style={inputStyle('full_name', !!errors.full_name)}
                placeholder="Your full name"
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

          <Controller name="email" control={control} render={({ field }) => (
            <View>
              <Text style={labelStyle}>Email</Text>
              <TextInput
                style={inputStyle('email', !!errors.email)}
                placeholder="you@example.com"
                placeholderTextColor={colors.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                onFocus={() => setFocused('email')}
                onBlur={() => { setFocused(null); field.onBlur() }}
                onChangeText={field.onChange}
                value={field.value}
              />
              {errors.email && <Text style={errorTextStyle}>{errors.email.message}</Text>}
            </View>
          )} />

          <Controller name="password" control={control} render={({ field }) => (
            <View>
              <Text style={labelStyle}>Password</Text>
              <TextInput
                style={inputStyle('password', !!errors.password)}
                placeholder="At least 8 characters"
                placeholderTextColor={colors.gray400}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                onFocus={() => setFocused('password')}
                onBlur={() => { setFocused(null); field.onBlur() }}
                onChangeText={field.onChange}
                value={field.value}
              />
              {errors.password && <Text style={errorTextStyle}>{errors.password.message}</Text>}
            </View>
          )} />

          <Controller name="terms" control={control} render={({ field }) => (
            <View>
              <Pressable
                onPress={() => field.onChange(!field.value)}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: !!field.value }}
              >
                <View style={{
                  width: 20, height: 20, borderRadius: 4, borderWidth: 1.5,
                  borderColor: field.value ? colors.navy : colors.sand,
                  backgroundColor: field.value ? colors.navy : 'transparent',
                  alignItems: 'center', justifyContent: 'center', marginTop: 2,
                }}>
                  {field.value && <Ionicons name="checkmark" size={13} color={colors.cream} />}
                </View>
                <Text style={{ flex: 1, fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, lineHeight: 20 }}>
                  I agree to the{' '}
                  <Text
                    style={{ color: colors.navy, fontFamily: 'Inter-Medium', textDecorationLine: 'underline' }}
                    onPress={(e) => { e.stopPropagation?.(); router.push('/rental-terms' as any) }}
                  >Rental Terms</Text>
                  {' '}and{' '}
                  <Text
                    style={{ color: colors.navy, fontFamily: 'Inter-Medium', textDecorationLine: 'underline' }}
                    onPress={(e) => { e.stopPropagation?.(); router.push('/privacy' as any) }}
                  >Privacy Policy</Text>
                </Text>
              </Pressable>
              {errors.terms && <Text style={[errorTextStyle, { marginTop: 4 }]}>{errors.terms.message}</Text>}
            </View>
          )} />

          <SocialAuthButtons onError={msg => setServerError(msg)} />

          <Button label="Create Account" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />

          <Text style={{ textAlign: 'center', color: colors.slate, fontFamily: 'Inter-Regular', fontSize: 14 }}>
            Already have an account?{' '}
            <Text onPress={() => router.replace('/(auth)/login')} style={{ color: colors.navy, fontFamily: 'Inter-Medium' }}>
              Sign in
            </Text>
          </Text>

          <Text
            onPress={() => router.replace('/(tabs)' as any)}
            accessibilityRole="link"
            accessibilityLabel="Browse the app without an account"
            style={{ textAlign: 'center', color: colors.slate + '99', fontFamily: 'Inter-Regular', fontSize: 13, paddingVertical: 4 }}
          >
            Browse without an account →
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const labelStyle = { fontFamily: 'Inter-Medium', fontSize: 13, color: colors.navy, marginBottom: 6, letterSpacing: 0.2 } as const
const errorTextStyle = { color: colors.error, fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 4 } as const
