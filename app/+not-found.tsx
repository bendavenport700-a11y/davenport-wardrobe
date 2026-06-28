import { View, Text, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/constants/colors'

export default function NotFound() {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', padding: 32, paddingTop: insets.top, paddingBottom: insets.bottom, gap: 16 }}>
      <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 28, color: colors.navy, letterSpacing: -0.5 }}>
        Page not found
      </Text>
      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.slate, textAlign: 'center', lineHeight: 22 }}>
        This link doesn't exist or has expired.
      </Text>
      <Pressable
        onPress={() => router.replace('/')}
        style={{ backgroundColor: colors.navy, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14, marginTop: 8 }}
      >
        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.cream }}>Go home</Text>
      </Pressable>
    </View>
  )
}
