import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/constants/colors'

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  right?: React.ReactNode
}

export function ScreenHeader({ title, subtitle, showBack = false, right }: ScreenHeaderProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  return (
    <View style={{
      paddingTop: insets.top + 10,
      paddingBottom: 18,
      paddingHorizontal: 24,
      backgroundColor: colors.cream,
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: colors.sand + '50',
    }}>
      <View style={{ flex: 1 }}>
        {showBack && (
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginBottom: 6 }}
            accessibilityLabel="Go back" accessibilityRole="button">
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, letterSpacing: 0.1 }}>← Back</Text>
          </Pressable>
        )}
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 28, color: colors.navy, letterSpacing: 0.2 }}>{title}</Text>
        {subtitle && (
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, marginTop: 3, lineHeight: 20 }}>{subtitle}</Text>
        )}
      </View>
      {right && <View>{right}</View>}
    </View>
  )
}
