import { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, KeyboardAvoidingView, Platform, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { colors } from '@/constants/colors'

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (done) {
      navTimerRef.current = setTimeout(() => router.replace('/(tabs)' as any), 1500)
    }
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current)
    }
  }, [done])

  const handleSubmit = async () => {
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    setError(null)
    const { error: e } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (e) { setError(e.message); return }
    setDone(true)
  }

  if (done) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="checkmark" size={32} color={colors.white} />
        </View>
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 24, color: colors.navy, textAlign: 'center' }}>
          Password updated.
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.slate, textAlign: 'center' }}>
          Signing you in…
        </Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.cream }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 20 }}>
        <View>
          <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 28, color: colors.navy, marginBottom: 8 }}>
            New password.
          </Text>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 16, color: colors.slate }}>
            Choose a new password for your account.
          </Text>
        </View>

        {error && (
          <View style={{ backgroundColor: colors.error + '15', borderRadius: 10, padding: 14 }}>
            <Text style={{ color: colors.error, fontFamily: 'Inter-Regular', fontSize: 14 }}>{error}</Text>
          </View>
        )}

        <View style={{ gap: 12 }}>
          <View>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy, marginBottom: 6 }}>New password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="At least 8 characters"
              placeholderTextColor={colors.gray400}
              textContentType="newPassword"
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              style={{
                borderWidth: 1.5,
                borderColor: focused === 'password' ? colors.navy : colors.sand,
                borderRadius: 12, padding: 14, fontFamily: 'Inter-Regular', fontSize: 16,
                color: colors.navy, backgroundColor: colors.white,
              }}
            />
          </View>
          <View>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy, marginBottom: 6 }}>Confirm password</Text>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              placeholder="Repeat your password"
              placeholderTextColor={colors.gray400}
              textContentType="newPassword"
              onFocus={() => setFocused('confirm')}
              onBlur={() => setFocused(null)}
              style={{
                borderWidth: 1.5,
                borderColor: focused === 'confirm' ? colors.navy : colors.sand,
                borderRadius: 12, padding: 14, fontFamily: 'Inter-Regular', fontSize: 16,
                color: colors.navy, backgroundColor: colors.white,
              }}
            />
          </View>
        </View>

        <Button label="Update Password" onPress={handleSubmit} loading={loading} />
        <Pressable onPress={() => router.replace('/(auth)/login' as any)} style={{ alignItems: 'center', padding: 8 }}>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate }}>Back to sign in</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}
