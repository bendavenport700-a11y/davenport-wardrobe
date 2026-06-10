import { useState } from 'react'
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { colors } from '@/constants/colors'
import { loginSchema, type LoginFormData } from '@/utils/schemas'

export default function LoginScreen() {
  const [serverError, setServerError] = useState<string | null>(null)

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setServerError(
        error.message.includes('Invalid') ? 'Incorrect email or password.' : error.message
      )
    }
    // On success, useProtectedRoute (NavigationGuard) handles redirect automatically
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 36, color: colors.navy, marginBottom: 8 }}>
          Welcome back.
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 16, color: colors.slate, marginBottom: 40 }}>
          Sign in to your wardrobe.
        </Text>

        {serverError && (
          <View style={{ backgroundColor: colors.error + '15', borderRadius: 10, padding: 14, marginBottom: 20 }}>
            <Text style={{ color: colors.error, fontFamily: 'Inter-Regular', fontSize: 14 }}>{serverError}</Text>
          </View>
        )}

        <View style={{ gap: 16 }}>
          <Controller name="email" control={control} render={({ field }) => (
            <View>
              <Text style={[labelStyle, { marginBottom: 6 }]}>Email</Text>
              <TextInput
                style={[inputStyle, errors.email && errorBorderStyle]}
                placeholder="you@example.com"
                placeholderTextColor={colors.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                onChangeText={field.onChange}
                value={field.value}
              />
              {errors.email && <Text style={errorTextStyle}>{errors.email.message}</Text>}
            </View>
          )} />

          <Controller name="password" control={control} render={({ field }) => (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={labelStyle}>Password</Text>
                <Text
                  onPress={() => router.push('/(auth)/forgot-password')}
                  accessibilityRole="link"
                  accessibilityLabel="Forgot password"
                  style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate }}
                >
                  Forgot?
                </Text>
              </View>
              <TextInput
                style={[inputStyle, errors.password && errorBorderStyle]}
                placeholder="Your password"
                placeholderTextColor={colors.gray400}
                secureTextEntry
                autoComplete="password"
                onChangeText={field.onChange}
                value={field.value}
              />
              {errors.password && <Text style={errorTextStyle}>{errors.password.message}</Text>}
            </View>
          )} />

          <Button
            label="Sign In"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
          />

          <Text style={{ textAlign: 'center', color: colors.slate, fontFamily: 'Inter-Regular', fontSize: 14 }}>
            New here?{' '}
            <Text
              onPress={() => router.replace('/(auth)/signup')}
              accessibilityRole="link"
              accessibilityLabel="Create a new account"
              style={{ color: colors.navy, fontFamily: 'Inter-Medium' }}
            >
              Create account
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const labelStyle = { fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy } as const
const inputStyle = {
  borderWidth: 1.5, borderColor: colors.sand, borderRadius: 10,
  padding: 14, fontFamily: 'Inter-Regular', fontSize: 16, color: colors.navy,
  backgroundColor: colors.white,
} as const
const errorBorderStyle = { borderColor: colors.error } as const
const errorTextStyle = { color: colors.error, fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 4 } as const
