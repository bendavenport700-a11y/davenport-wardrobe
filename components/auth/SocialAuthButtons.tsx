import { useEffect, useState } from 'react'
import { View, Text, Platform } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import * as Crypto from 'expo-crypto'
import { supabase } from '@/lib/supabase'
import { colors } from '@/constants/colors'

export function SocialAuthButtons({ onError }: { onError: (msg: string) => void }) {
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    if (Platform.OS !== 'ios') return
    AppleAuthentication.isAvailableAsync().then(setAvailable)
  }, [])

  const handleApple = async () => {
    try {
      // Nonce prevents replay attacks — Apple embeds the SHA-256 hash in the JWT,
      // Supabase verifies it against the raw value we pass.
      const rawNonce = Crypto.randomUUID()
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      )

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      })

      if (!credential.identityToken) {
        onError('Sign in with Apple failed. Please try again.')
        return
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
      })

      if (error) { console.error('Supabase signInWithIdToken error:', error); onError(error.message); return }

      // Apple only sends the full name on the very first sign-in — save it immediately
      if (data.user && credential.fullName?.givenName) {
        const fullName = [credential.fullName.givenName, credential.fullName.familyName]
          .filter(Boolean).join(' ')
        await supabase.from('profiles').update({ full_name: fullName }).eq('id', data.user.id)
      }

      // _layout.tsx onAuthStateChange + useProtectedRoute handle the redirect
    } catch (err: any) {
      if (err.code !== 'ERR_REQUEST_CANCELED') {
        console.error('Apple Sign In error:', err)
        onError('Sign in with Apple failed. Please try again.')
      }
    }
  }

  if (!available) return null

  return (
    <View style={{ gap: 16 }}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={10}
        style={{ width: '100%', height: 50 }}
        onPress={handleApple}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.sand }} />
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate }}>or</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.sand }} />
      </View>
    </View>
  )
}
