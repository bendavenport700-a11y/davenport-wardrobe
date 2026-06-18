import { useState } from 'react'
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { colors } from '@/constants/colors'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/utils/schemas'

export default function ForgotPasswordScreen() {
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setServerError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: 'davenport://reset-password',
    })
    if (error) {
      setServerError(error.message)
      return
    }
    setSentEmail(data.email)
    setSent(true)
  }

  if (sent) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Ionicons name="checkmark" size={32} color={colors.white} />
        </View>
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 24, color: colors.navy, textAlign: 'center', marginBottom: 12 }}>
          Check your email.
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 16, color: colors.slate, textAlign: 'center', marginBottom: 32 }}>
          We sent a password reset link to {sentEmail}.
        </Text>
        <Button label="Back to Sign In" onPress={() => router.replace('/(auth)/login')} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 28, color: colors.navy, marginBottom: 8 }}>
          Reset password.
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 16, color: colors.slate, marginBottom: 32 }}>
          Enter your email and we'll send you a link.
        </Text>

        {serverError && (
          <View style={{ backgroundColor: colors.error + '15', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <Text style={{ color: colors.error, fontFamily: 'Inter-Regular', fontSize: 14 }}>{serverError}</Text>
          </View>
        )}

        <View style={{ gap: 16 }}>
          <Controller name="email" control={control} render={({ field }) => (
            <View>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy, marginBottom: 6 }}>Email</Text>
              <TextInput
                style={[{
                  borderWidth: 1.5, borderColor: errors.email ? colors.error : colors.sand,
                  borderRadius: 10, padding: 14, fontFamily: 'Inter-Regular',
                  fontSize: 16, color: colors.navy, backgroundColor: colors.white,
                }]}
                placeholder="you@example.com"
                placeholderTextColor={colors.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={field.onChange}
                value={field.value}
              />
              {errors.email && <Text style={{ color: colors.error, fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 4 }}>{errors.email.message}</Text>}
            </View>
          )} />

          <Button label="Send Reset Link" onPress={handleSubmit(onSubmit)} loading={isSubmitting} />
          <Button label="Back to Sign In" onPress={() => router.replace('/(auth)/login')} variant="ghost" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
